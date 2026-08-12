import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHudStore } from "./hudStore";
import type { HudData } from "./hudStore";

describe("T1 & T2: HudStore (Throttling & Preservation)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("T1: 間引き間隔 12Hz 相当 - 短い間隔で連続して値を流したとき届く回数が抑えられる", () => {
    const intervalMs = 1000 / 12; // 約 83.33ms
    const store = createHudStore(intervalMs);
    const callback = vi.fn();

    store.subscribe(callback);

    let currentTime = 1000;
    // 最初の更新 (lastEmitTime = 0 から elapsed >= intervalMs なので即時発火)
    store.update(
      { speed: 10, altitude: 50, reticle: { locked: false, distance: null } },
      currentTime
    );
    expect(callback).toHaveBeenCalledTimes(1);

    // 短い間隔 (10ms ごと) で 5 回連続更新
    for (let i = 1; i <= 5; i++) {
      currentTime += 10;
      store.update(
        { speed: 10 + i, altitude: 50 + i, reticle: { locked: false, distance: null } },
        currentTime
      );
    }

    // 10ms * 5 = 50ms 経過時点ではまだ intervalMs (83.33ms) 未満のため、リスナーは初回以降追加発火していない
    expect(callback).toHaveBeenCalledTimes(1);

    // タイマーを進めて intervalMs を経過させる
    vi.advanceTimersByTime(100);

    // 1 回追加で発火して計 2 回となっている
    expect(callback).toHaveBeenCalledTimes(2);

    store.dispose();
  });

  it("T2: 間引き中 - 最後に流した値が保持され、最新の値が失われない", () => {
    const intervalMs = 100;
    const store = createHudStore(intervalMs);
    const callback = vi.fn();

    store.subscribe(callback);

    let currentTime = 1000;
    // 初回発火
    store.update(
      { speed: 0, altitude: 0, reticle: { locked: false, distance: null } },
      currentTime
    );

    // 間引き期間中に複数回更新
    currentTime += 20;
    store.update(
      { speed: 10, altitude: 10, reticle: { locked: false, distance: null } },
      currentTime
    );

    currentTime += 20;
    store.update(
      { speed: 20, altitude: 20, reticle: { locked: true, distance: 15 } },
      currentTime
    );

    currentTime += 20;
    const latestData: HudData = {
      speed: 55.5,
      altitude: 120.0,
      reticle: { locked: true, distance: 42.5 },
    };
    store.update(latestData, currentTime);

    // タイマーを発火させる
    vi.advanceTimersByTime(100);

    // 最新の値がスナップショットとして保持され届いている
    expect(store.getSnapshot()).toEqual(latestData);

    store.dispose();
  });

  // 間引きの対象は「連続的に変わる数値」だけ。レティクルのロックは離散的な
  // 状態変化なので、遅らせると照準が反応しないように見える。
  it("T6: ロック状態が変わったときは間引きを飛ばして即座に通知する", () => {
    const intervalMs = 1000 / 12;
    const store = createHudStore(intervalMs);
    const callback = vi.fn();
    store.subscribe(callback);

    let t = 1000;
    store.update(
      { speed: 10, altitude: 50, reticle: { locked: false, distance: null } },
      t
    );
    expect(callback).toHaveBeenCalledTimes(1);

    // 間引き窓の内側 (10ms 後) でロックが成立した
    t += 10;
    store.update({ speed: 10, altitude: 50, reticle: { locked: true, distance: 42 } }, t);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().reticle.locked).toBe(true);

    store.dispose();
  });

  it("T7: 距離だけが変わったときは間引きを飛ばさない", () => {
    // 距離は連続値。ここで飛ばすと毎フレーム通知が走り、間引きが実質無効になる。
    const intervalMs = 1000 / 12;
    const store = createHudStore(intervalMs);
    const callback = vi.fn();
    store.subscribe(callback);

    let t = 1000;
    store.update({ speed: 10, altitude: 50, reticle: { locked: true, distance: 40 } }, t);
    expect(callback).toHaveBeenCalledTimes(1);

    for (let i = 1; i <= 5; i++) {
      t += 10;
      store.update(
        { speed: 10, altitude: 50, reticle: { locked: true, distance: 40 + i } },
        t
      );
    }

    expect(callback).toHaveBeenCalledTimes(1);

    store.dispose();
  });
});
