import { useSyncExternalStore } from "react";
import type { HudStore } from "../lib/hudStore";

type ReticleProps = {
  store: HudStore;
};

export function Reticle({ store }: ReticleProps) {
  const data = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const { locked, distance } = data.reticle;

  return (
    <div
      data-testid="reticle"
      data-locked={locked}
      data-distance={distance}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        className={`tabular transition-all duration-150 ${locked ? "scale-125 text-[var(--wire)]" : "scale-100 opacity-60"}`}
      >
        {locked ? "⌗" : "·"}
      </div>
    </div>
  );
}
