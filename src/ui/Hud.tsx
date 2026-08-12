import { useSyncExternalStore } from "react";
import type { HudStore } from "../lib/hudStore";

type HudProps = {
  store: HudStore;
};

export function Hud({ store }: HudProps) {
  const data = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return (
    <div
      data-testid="hud"
      className="tabular pointer-events-none absolute top-4 left-4 rounded bg-black/40 px-3 py-1.5 text-sm font-mono text-[var(--hud)] backdrop-blur-sm"
    >
      SPD: {data.speed.toFixed(1)} m/s | ALT: {data.altitude.toFixed(1)} m
    </div>
  );
}
