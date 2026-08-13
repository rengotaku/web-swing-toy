#!/bin/sh
# dev サーバの状態確認・停止・起動待ちを、ポートの所有者を確かめてから行う。
#
# POSIX sh で書いてある。make の既定シェルから呼ばれるうえ、zsh が入っていない
# 環境（CI の Ubuntu ランナー等）でも壊れないようにするため。
#
# 5173 のような既定ポートは別プロジェクトが使っていることがある。所有者を見ずに
# 止めると他人のサーバを殺すので、この repo が起動したものだと確認できたときだけ
# 触る（確認できなければ何もしない fail-closed）。
set -eu

REPO_DIR=$(cd "$(dirname "$0")/.." && pwd)
CMD=${1:-status}
PORT=${2:-5173}

# 指定ポートを listen している PID を返す。
# -sTCP:LISTEN は必須。付けないとそのポートへ「接続している」クライアント
# （この toy を開いているブラウザ）の PID まで返り、サーバを止めるつもりで
# ブラウザを殺すことになる。
listening_pids() {
  lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null || true
}

# PID の作業ディレクトリ。取得できなければ空文字（= 判定不能）。
pid_cwd() {
  if [ -r "/proc/$1/cwd" ]; then
    readlink "/proc/$1/cwd" 2>/dev/null || true
  else
    # /proc が無い環境（macOS 等）。lsof から引く。
    lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1
  fi
}

# この repo のものだと確認できた PID だけを返す。
# 判定できなかったものは「自分のではない」側に倒す。
owned_pids() {
  for pid in $(listening_pids); do
    cwd=$(pid_cwd "$pid")
    case "$cwd" in
      "$REPO_DIR" | "$REPO_DIR"/*) printf '%s\n' "$pid" ;;
    esac
  done
}

# 誰かが使っているが、この repo のものではない場合に説明して終了する。
refuse_if_foreign() {
  pids=$(listening_pids)
  [ -n "$pids" ] || return 0
  owned=$(owned_pids)
  [ -z "$owned" ] || return 0

  echo "port $PORT is in use by another project:" >&2
  for pid in $pids; do
    echo "  pid $pid  cwd=$(pid_cwd "$pid")" >&2
  done
  echo "run with a different port, e.g. make $CMD PORT=5199" >&2
  exit 1
}

case "$CMD" in
  status)
    if [ -n "$(owned_pids)" ]; then
      echo "web-swing-toy: running (:$PORT)"
    elif [ -n "$(listening_pids)" ]; then
      echo "web-swing-toy: stopped (:$PORT is held by another project)"
    else
      echo "web-swing-toy: stopped"
    fi
    ;;
  stop)
    pids=$(owned_pids)
    if [ -n "$pids" ]; then
      # shellcheck disable=SC2086
      kill $pids 2>/dev/null || true
      echo "stopped dev server on :$PORT"
    elif [ -n "$(listening_pids)" ]; then
      echo "left :$PORT alone; it belongs to another project" >&2
    else
      echo "no dev server listening on :$PORT"
    fi
    ;;
  ensure)
    # 既にこの repo のサーバが居ればそのまま使う。他人のものなら止める。
    refuse_if_foreign
    if [ -n "$(owned_pids)" ]; then
      exit 0
    fi
    log=${3:-/tmp/web-swing-toy-dev-$PORT.log}
    echo "starting dev server on :$PORT (log: $log)"
    # setsid は macOS の標準環境には無い。無ければ nohup だけで切り離す
    # (端末を閉じても生き残る。プロセスグループが分かれないだけ)。
    if command -v setsid >/dev/null 2>&1; then
      (cd "$REPO_DIR" && setsid nohup npm run dev -- --port "$PORT" --strictPort >"$log" 2>&1 </dev/null &)
    else
      (cd "$REPO_DIR" && nohup npm run dev -- --port "$PORT" --strictPort >"$log" 2>&1 </dev/null &)
    fi
    i=0
    while [ "$i" -lt 30 ]; do
      if [ -n "$(owned_pids)" ]; then exit 0; fi
      sleep 1
      i=$((i + 1))
    done
    echo "dev server did not come up on :$PORT. see $log" >&2
    exit 1
    ;;
  *)
    echo "usage: devserver.sh {status|stop|ensure} [port] [logfile]" >&2
    exit 2
    ;;
esac
