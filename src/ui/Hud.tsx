import { useSyncExternalStore } from "react";
import type { HudStore } from "../lib/hudStore";

type HudProps = {
  store: HudStore;
};

/**
 * 速度と高度。読めればよいので、枠も背景も置かない。
 *
 * 数字は等幅・tabular-nums で桁が動かないようにしてある。値は 12Hz に
 * 間引いて届く（毎秒 60 回変わる数字は読めないため）。
 */
export function Hud({ store }: HudProps) {
  const data = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return (
    <div
      data-testid="hud"
      className="hud-readout pointer-events-none absolute top-6 left-6 select-none"
    >
      <div className="flex items-baseline gap-1.5">
        <span className="tabular text-[2.75rem] leading-none font-medium text-[var(--hud)]">
          {data.speed.toFixed(0)}
        </span>
        <span className="tabular text-xs tracking-widest text-[var(--hud)] opacity-55">
          M/S
        </span>
      </div>
      <div className="tabular mt-1 text-xs tracking-widest text-[var(--hud)] opacity-55">
        ALT {data.altitude.toFixed(0)}
      </div>
    </div>
  );
}
