import { useEffect, useState } from "react";
import { isWebGLAvailable } from "../lib/webgl";
import { createGame } from "../render/game";

/**
 * React コンポーネントで Three.js のゲームループをマウント/アンマウント管理するフック。
 * WebGL が利用不可、または createGame に失敗した場合に isAvailable: false を返す。
 */
export function useGame(
  containerRef: React.RefObject<HTMLElement | null>,
  hudRef?: React.RefObject<HTMLElement | null>
): { isAvailable: boolean } {
  const [isAvailable, setIsAvailable] = useState<boolean>(() => isWebGLAvailable());

  useEffect(() => {
    if (!isAvailable) return;

    const container = containerRef.current;
    if (!container) return;

    let game;
    try {
      game = createGame(container, hudRef?.current);
    } catch {
      queueMicrotask(() => setIsAvailable(false));
      return;
    }

    if (!game) {
      queueMicrotask(() => setIsAvailable(false));
      return;
    }

    return () => {
      game.dispose();
    };
  }, [containerRef, hudRef, isAvailable]);

  return { isAvailable };
}
