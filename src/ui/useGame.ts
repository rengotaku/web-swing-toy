import { useEffect } from "react";
import { createGame } from "../render/game";

/**
 * React コンポーネントで Three.js のゲームループをマウント/アンマウント管理するフック。
 * StrictMode での二重マウント時に漏れなく dispose() を呼ぶ。
 */
export function useGame(
  containerRef: React.RefObject<HTMLElement | null>,
  hudRef?: React.RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const game = createGame(container, hudRef?.current);

    return () => {
      game.dispose();
    };
  }, [containerRef, hudRef]);
}
