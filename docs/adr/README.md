# ADR 索引

<!-- generate-adr-index.zsh による自動生成。手で編集しない -->

| ADR | タイトル | status | date | 要旨 |
|---|---|---|---|---|
| [0001](0001-pure-typescript-simulation-layer.md) | シミュレーションを Three.js から独立した純 TypeScript 層に置く | accepted | 2026-08-12 | 振り子物理・都市生成・アンカー判定を three と DOM から切り離し、単体テスト可能にする。 |
| [0002](0002-auto-relaunch-instead-of-wire-recovery.md) | 着地からの復帰をワイヤーではなく自動リランチにする | accepted | 2026-08-12 | 接地して止まったら自動で上空へ戻す。ワイヤーで自力復帰させる案は物理的に成立しなかった。 |
| [0003](0003-coverage-gate-scoped-to-branching-logic.md) | カバレッジゲートを分岐ロジック層だけに掛ける | accepted | 2026-08-12 | 80% のゲートは engine / lib / hooks だけに掛け、描画層と HUD はスクリーンショットで検証する。 |
