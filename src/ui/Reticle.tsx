import { useEffect, useRef, useSyncExternalStore } from "react";
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
 *
 * 位置はカーソルそのもの。狙いはポインタ位置の ray で判定しているので、
 * 画面中央に固定して描くと「照準が指している場所」と「実際に掴む場所」が
 * 食い違う。位置だけは間引いたストアを通さず DOM へ直接書く（12Hz だと
 * カーソルから目に見えて遅れる）。
 */
export function Reticle({ store }: ReticleProps) {
  const data = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const { locked, attached } = data.reticle;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    };
    // 起動直後、まだ一度もポインタが動いていない間は画面中央に置く
    // （判定側も中央を既定にしている）。
    el.style.transform = `translate3d(${window.innerWidth / 2}px, ${window.innerHeight / 2}px, 0) translate(-50%, -50%)`;
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

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
      ref={ref}
      data-testid="reticle"
      data-locked={locked}
      data-attached={attached}
      className="reticle-root pointer-events-none absolute top-0 left-0"
      style={{ opacity: attached ? 0 : 1 }}
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
