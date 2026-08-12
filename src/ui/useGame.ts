import { useEffect, useState } from "react";
import { isWebGLAvailable } from "../lib/webgl";
import { createGame } from "../render/game";
import type { Game } from "../render/game";

/**
 * React コンポーネントで Three.js のゲームループをマウント/アンマウント管理するフック。
 * WebGL が利用不可、または createGame に失敗した場合に isAvailable: false を返す。
 */
export function useGame(containerRef: React.RefObject<HTMLElement | null>): {
  isAvailable: boolean;
  game: Game | null;
} {
  const [isAvailable, setIsAvailable] = useState<boolean>(() => isWebGLAvailable());
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    if (!isAvailable) return;

    const container = containerRef.current;
    if (!container) return;

    let instance: Game | null = null;
    try {
      instance = createGame(container);
    } catch {
      queueMicrotask(() => setIsAvailable(false));
      return;
    }

    if (!instance) {
      queueMicrotask(() => setIsAvailable(false));
      return;
    }

    setGame(instance);

    return () => {
      instance.dispose();
      setGame(null);
    };
  }, [containerRef, isAvailable]);

  return { isAvailable, game };
}
