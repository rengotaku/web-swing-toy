import { useSyncExternalStore } from "react";
import type { HintTracker } from "../lib/hintTracker";

type HintProps = {
  tracker: HintTracker;
};

export function Hint({ tracker }: HintProps) {
  const isVisible = useSyncExternalStore(tracker.subscribe, tracker.isHintVisible);

  if (!isVisible) return null;

  return (
    <div
      data-testid="hint"
      className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded bg-black/50 px-4 py-2 text-sm text-[var(--hud)] backdrop-blur-sm"
    >
      hold to shoot a wire · release
    </div>
  );
}
