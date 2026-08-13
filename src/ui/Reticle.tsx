import { useSyncExternalStore } from "react";
import type { HudStore } from "../lib/hudStore";

type ReticleProps = {
  store: HudStore;
};

/**
 * 照準。この画面が記憶される要素なので、ここだけは丁寧に作る。
 *
 * 待機中は小さな点だけを置く。カーソルの下に掴めるアンカーが入った瞬間、
 * 四隅のブラケットが内側へスナップして、点がワイヤーの色に変わる。
 * ワイヤーを繋いでいる間は退く（ワイヤー自体がその役目を引き継ぐため）。
 *
 * スナップは短く切る。機械が噛み合う動きであって、なめらかに追従する
 * ものではない。
 */
export function Reticle({ store }: ReticleProps) {
  const data = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const { locked } = data.reticle;

  // ブラケットの位置。ロック時は内側へ寄る。
  const inset = locked ? 7 : 15;
  const arm = 7;
  const corners = [
    { x: inset, y: inset, dx: arm, dy: arm },
    { x: 48 - inset, y: inset, dx: -arm, dy: arm },
    { x: inset, y: 48 - inset, dx: arm, dy: -arm },
    { x: 48 - inset, y: 48 - inset, dx: -arm, dy: -arm },
  ];

  return (
    <div
      data-testid="reticle"
      data-locked={locked}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" className="overflow-visible">
        {corners.map((c, i) => (
          <path
            key={i}
            d={`M ${c.x} ${c.y + c.dy} L ${c.x} ${c.y} L ${c.x + c.dx} ${c.y}`}
            fill="none"
            stroke="var(--wire)"
            strokeWidth="1.5"
            strokeLinecap="square"
            className="reticle-bracket"
            style={{ opacity: locked ? 1 : 0 }}
          />
        ))}
        <circle
          cx="24"
          cy="24"
          r={locked ? 1.6 : 1.4}
          fill={locked ? "var(--wire)" : "var(--hud)"}
          className="reticle-dot"
          style={{ opacity: locked ? 1 : 0.45 }}
        />
      </svg>
    </div>
  );
}
