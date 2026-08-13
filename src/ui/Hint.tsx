import { useSyncExternalStore } from "react";
import type { HintTracker } from "../lib/hintTracker";

type HintProps = {
  tracker: HintTracker;
};

/**
 * 初回だけ出る操作の案内。1 度スイングを終えたら二度と出ない。
 *
 * 両方の動詞を通す。掴むところで終わらせると、離して飛ぶという肝心の
 * 半分が伝わらない。
 */
export function Hint({ tracker }: HintProps) {
  const isVisible = useSyncExternalStore(tracker.subscribe, tracker.isHintVisible);

  if (!isVisible) return null;

  return (
    <p
      data-testid="hint"
      className="hud-readout pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-sm tracking-wide text-[var(--hud)] opacity-70 select-none"
    >
      hold to shoot a wire · release to fly
    </p>
  );
}
