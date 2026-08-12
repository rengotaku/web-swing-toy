export type GameLoop = {
  start: () => void;
  stop: () => void;
};

/**
 * requestAnimationFrame ループを作成する。
 * 実経過時間を秒単位 (dt) で計測して onTick コールバックに渡す。
 */
export function createGameLoop(onTick: (dt: number) => void): GameLoop {
  let frameId: number | null = null;
  let lastTime: number | null = null;
  let running = false;

  const loop = (time: number) => {
    if (!running) return;

    if (lastTime === null) {
      lastTime = time;
    }

    // 経過時間 (秒)
    const elapsedSeconds = (time - lastTime) / 1000;
    lastTime = time;

    // タブ切り替え等の急激なデルタスパイクを防止 (最大 0.1 秒にクランプ)
    const dt = Math.max(0, Math.min(elapsedSeconds, 0.1));

    onTick(dt);

    if (running) {
      frameId = requestAnimationFrame(loop);
    }
  };

  const start = () => {
    if (running) return;
    running = true;
    lastTime = null;
    frameId = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  return {
    start,
    stop,
  };
}
