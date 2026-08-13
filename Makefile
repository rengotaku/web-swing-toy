.PHONY: install compose-ui run play build preview stop status lint lint-fix format format-check \
	test test-watch test-cov check ci clean help

# Default target
.DEFAULT_GOAL := help

# Variables
PORT ?= 5173

# play: 隔離した Chrome プロファイルの置き場所。
# Chrome の「ハードウェアアクセラレーション」設定はプロファイル単位なので、
# 既定のプロファイルとは別のディレクトリを渡せば、既定のブラウザの設定・タブ・
# 拡張に一切触らずに WebGL を有効なまま起動できる。新規プロファイルは既定で
# アクセラレーションが有効なので、追加のフラグは要らない。
CHROME_PROFILE ?= $(HOME)/.local/share/web-swing-toy-chrome

# ベンダの実体を PATH より先に探す。PATH 上の `google-chrome` が
# `--disable-gpu` を注入するラッパーになっていることがあり（VRAM を GPU
# ジョブに残すために常用ブラウザの GPU を切る、といった運用は普通にある）、
# それを踏むと WebGL が使えず、この toy は動かない。
# 別のブラウザを使いたいときは CHROME_BIN=/path/to/chrome で上書きする。
CHROME_BIN ?= $(shell \
	for c in /opt/google/chrome/google-chrome /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome; do \
		[ -x "$$c" ] && { echo "$$c"; exit 0; }; \
	done; \
	command -v google-chrome 2>/dev/null || command -v google-chrome-stable 2>/dev/null \
		|| command -v chromium 2>/dev/null || command -v chromium-browser 2>/dev/null)
DEV_LOG ?= /tmp/web-swing-toy-dev-$(PORT).log

# shared-react-ui: composed in-place from sibling repo dir during local dev.
# Outside the monorepo (after scaffold) the source dir is absent and the
# target becomes a no-op, so the scaffolded project keeps working unchanged.
SHARED_UI_SRC := ../shared-react-ui/src/ui
SHARED_UI_DEST := src/components/ui

## install: Install dependencies (composes shared-react-ui first)
install: compose-ui
	npm install

## compose-ui: Materialize src/components/ui/ from ../shared-react-ui/ (no-op outside monorepo)
compose-ui:
	@if [ -d "$(SHARED_UI_SRC)" ]; then \
		echo "[compose-ui] $(SHARED_UI_SRC) -> $(SHARED_UI_DEST) (excl. *.stories.tsx)"; \
		mkdir -p $(SHARED_UI_DEST); \
		rsync -a --exclude='*.stories.tsx' $(SHARED_UI_SRC)/ $(SHARED_UI_DEST)/; \
	fi

## run: Start the Vite dev server
run:
	npm run dev

## build: Build the production bundle
build:
	npm run build

## preview: Preview the production build locally
preview:
	npm run preview

## play: Open the toy in an isolated Chrome profile (starts the dev server if needed)
play:
	@if [ -z "$(CHROME_BIN)" ]; then \
		echo "Chrome/Chromium not found. Set CHROME_BIN=/path/to/chrome" >&2; exit 1; \
	fi
	@sh scripts/devserver.sh ensure $(PORT) $(DEV_LOG)
	@mkdir -p "$(CHROME_PROFILE)"
	@echo "opening http://localhost:$(PORT)/ in a separate Chrome profile"
	@echo "  profile: $(CHROME_PROFILE)  (your default browser is untouched)"
	@# setsid は macOS の標準環境には無い。無ければ nohup だけで切り離す。
	@if command -v setsid >/dev/null 2>&1; then DETACH=setsid; else DETACH=""; fi; \
	$$DETACH nohup "$(CHROME_BIN)" \
		--user-data-dir="$(CHROME_PROFILE)" \
		--no-first-run --no-default-browser-check \
		"http://localhost:$(PORT)/" >/dev/null 2>&1 < /dev/null &

## stop: Stop the dev server
stop:
	@sh scripts/devserver.sh stop $(PORT)

## status: Check if the dev server is running
status:
	@sh scripts/devserver.sh status $(PORT)

## lint: Run linter
lint:
	npm run lint

## lint-fix: Auto-fix lint issues
lint-fix:
	npm run lint:fix

## format: Format source files
format:
	npm run format

## format-check: Check formatting without modifying files
format-check:
	npm run format:check

## test: Run tests
test:
	npm run test

## test-watch: Run tests in watch mode
test-watch:
	npm run test:watch

## test-cov: Run tests with coverage
test-cov:
	npm run test:coverage

## check: Run lint + test
check: lint test

## ci: Run lint + format-check + test with coverage + build
ci: lint format-check test-cov build

## clean: Remove build artifacts
clean:
	rm -rf dist node_modules coverage

## help: Show this help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
