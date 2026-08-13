---
last_verified: 2026-08-13
---

# ARCHITECTURE

ブラウザで動くワイヤーアクションのおもちゃ。プレイヤーは手続き生成された街の上空を、ビルにワイヤーを繋いだ振り子運動で飛び回る。目的もスコアも無い。

## 構成

| ディレクトリ | 責務 | 依存してよいもの |
|---|---|---|
| `src/engine/` | シミュレーション本体。振り子物理・都市生成・アンカー判定・カメラ計算 | 何にも依存しない（純 TypeScript） |
| `src/render/` | Three.js のシーン、メッシュ、フレームループ | `src/engine` |
| `src/input/` | ポインタ座標 → 正規化デバイス座標 → ray への変換 | `src/engine`, three |
| `src/ui/` | canvas の上に重ねる React の HUD | `src/lib`, `src/hooks` |
| `src/lib/` | UI と描画をつなぐ状態（HUD ストア・ヒント）と WebGL 判定 | 何にも依存しない |
| `src/hooks/` | React のフック（永続化・`prefers-reduced-motion`） | — |
| `scripts/` | dev サーバの起動・停止（ポート所有者を確認する） | — |

**`src/engine` は `three` も DOM API も import しない。** これがこの構成の中心的な制約で、物理を単体テストできる根拠になっている。時間は必ず引数の `dt` として受け取り、乱数は使わない（都市は座標のハッシュから決定論的に導出する）。

## データフロー

```
pointer イベント
   └→ src/input       … 画面座標 → NDC → ray
        └→ engine/anchor  … ray-AABB で掴めるアンカーを探す
             └→ engine/swinger … 距離拘束 + 固定ステップ積分で状態を進める
                  ├→ render/*   … Three.js のシーンへ反映して描画
                  └→ lib/hudStore … UI へ配信（数値は間引き、状態変化は即時）
                       └→ ui/*   … React が HUD・照準・ヒントを描く
```

永続化は「ヒントを見終わったか」だけで、`localStorage` に置く。ゲームの進行は保存しない。

## どこを触れば何が変わるか

| 変えたいこと | 触る場所 |
|---|---|
| 重力・空気抵抗・巻き取り速度・カメラの遅れ・FOV の広がり | `src/engine/tuning.ts`（数値はすべてここに集約） |
| 街の密度・ビルの高さ・街路の幅・ワイヤーの射程 | `src/engine/tuning.ts` |
| 振り子の解き方そのもの | `src/engine/rope.ts`, `src/engine/swinger.ts` |
| 掴める対象の判定 | `src/engine/anchor.ts` |
| 空の色・フォグ・照明・地面 | `src/render/scene.ts` |
| ビルの見た目 | `src/render/city.ts` |
| ワイヤーの見た目・太さ | `src/render/wire.ts` |
| 照準・速度表示・ヒント | `src/ui/` |
| 配色・タイポグラフィのトークン | `src/index.css` |
| 着地からの復帰の挙動 | `src/render/game.ts`（自動リランチ） |

## 検証の分担

| 層 | 検証方法 |
|---|---|
| `src/engine`, `src/lib`, `src/hooks` | 単体テスト。カバレッジ 80% のゲートはこの層だけに掛かる |
| `src/render`, `src/ui` | ブラウザでの実測とスクリーンショット |

描画層に単体テストを書かないのは手抜きではなく、jsdom に WebGL が無いため**画面が壊れていても通るテスト**しか書けないから。そこを分母に入れると同語反復のテストを書く動機が生まれる。

## 公開

`main` への push で `.github/workflows/deploy.yml` が GitHub Pages へ公開する。lint / test / build を通してから公開するので、赤いビルドは公開 URL に届かない。

Pages はリポジトリ名のサブパスで配信されるため、ビルド時に `BASE_PATH` を渡す。**渡し忘れるとローカルでは完全に動くまま公開先だけ白画面になる。**

## 経緯（why）は docs/adr/ を見る

設計判断の経緯・捨てた案・壊すと危ない前提は [docs/adr/README.md](adr/README.md)（索引）から辿る。本ファイルには経緯を書かない。
