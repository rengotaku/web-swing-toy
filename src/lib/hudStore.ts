export type ReticleState = {
  locked: boolean;
  distance: number | null;
  /** ワイヤー接続中。接続中はワイヤー自体が役目を引き継ぐので照準は退く。 */
  attached: boolean;
};

export type HudData = {
  speed: number;
  altitude: number;
  reticle: ReticleState;
};

export interface HudStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => HudData;
  update: (data: HudData, now?: number) => void;
  dispose: () => void;
}

/**
 * HUD データを配信するストア。
 *
 * 間引くのは速度・高度のような**連続的に変わる数値**だけで、理由は性能ではなく
 * 可読性にある。毎秒 60 回書き換わる数字は読めないので 12Hz 程度に落とす。
 *
 * 一方でレティクルのロックは**離散的な状態の変化**であり、間引くと照準が
 * 遅れて追従する。これは節約ではなく手触りの劣化にしかならないので、
 * `locked` が変わったときは間引きを飛ばして即座に通知する。
 *
 * 連続値は間引き、離散的な状態変化は即時。この 2 つを同じ間隔にまとめない。
 */
export function createHudStore(intervalMs: number = 1000 / 12): HudStore {
  const listeners = new Set<() => void>();
  let currentSnapshot: HudData = {
    speed: 0,
    altitude: 0,
    reticle: { locked: false, distance: null, attached: false },
  };

  let pendingData: HudData | null = null;
  let lastEmitTime = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const emit = (data: HudData, now: number) => {
    currentSnapshot = data;
    lastEmitTime = now;
    pendingData = null;
    listeners.forEach((fn) => fn());
  };

  const scheduleFlush = (delayMs: number) => {
    if (timerId !== null) return;
    timerId = setTimeout(
      () => {
        timerId = null;
        if (pendingData !== null) {
          const now = typeof performance !== "undefined" ? performance.now() : Date.now();
          emit(pendingData, now);
        }
      },
      Math.max(0, delayMs)
    );
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const getSnapshot = () => currentSnapshot;

  const update = (data: HudData, nowInput?: number) => {
    const now =
      nowInput !== undefined
        ? nowInput
        : typeof performance !== "undefined"
          ? performance.now()
          : Date.now();

    const elapsed = now - lastEmitTime;

    // ロック状態が変わった瞬間だけは間引きを飛ばす。照準の応答が遅れると
    // 「狙えているのに反応しない」に見える。距離の数値の変化では飛ばさない
    // (連続値なので、これで飛ばすと間引きが実質無効になる)。
    // 照準は離散的な状態なので、変化した瞬間だけ間引きを飛ばす。
    // 位置は乗せていない（カーソル追従は 12Hz では遅れるため、DOM へ直接書く）。
    const stateChanged =
      data.reticle.locked !== currentSnapshot.reticle.locked ||
      data.reticle.attached !== currentSnapshot.reticle.attached;

    if (elapsed >= intervalMs || stateChanged) {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      emit(data, now);
    } else {
      pendingData = data;
      scheduleFlush(intervalMs - elapsed);
    }
  };

  const dispose = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    listeners.clear();
  };

  return {
    subscribe,
    getSnapshot,
    update,
    dispose,
  };
}
