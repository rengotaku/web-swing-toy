import { describe, expect, it } from "vitest";
import {
  FIXED_DT,
  type Swinger,
  advanceSwinger,
  attachRope,
  detachRope,
} from "./swinger";
import { DEFAULT_TUNING } from "./tuning";
import { distance, length, vec3 } from "./vec3";

describe("swinger", () => {
  it("S1: ワイヤーなし・空中・初速 0 では重力が効く", () => {
    const initial: Swinger = {
      position: vec3(0, 100, 0),
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    const next = advanceSwinger(initial, 1.0, DEFAULT_TUNING);

    expect(next.velocity.y).toBeLessThan(0);
    expect(next.position.y).toBeLessThan(100);
  });

  it("S-SPEED: 空中でのスイングで速度 50 m/s 超に達することの実測検証", () => {
    let state: Swinger = {
      position: vec3(0, 350, 0),
      velocity: vec3(0, 5, 30),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    const anchor = vec3(0, 300, 250);

    for (let i = 0; i < 150; i++) {
      state = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING);
    }

    state = attachRope(state, anchor, DEFAULT_TUNING);

    let maxSpeed = 0;
    for (let i = 0; i < 300; i++) {
      state = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING, { reeling: true });
      const currentSpeed = length(state.velocity);
      if (currentSpeed > maxSpeed) {
        maxSpeed = currentSpeed;
      }
    }

    state = detachRope(state);
    const postReleaseSpeed = length(state.velocity);
    if (postReleaseSpeed > maxSpeed) {
      maxSpeed = postReleaseSpeed;
    }

    expect(maxSpeed).toBeGreaterThan(50.0);
  });

  it("S2: ワイヤーなし・水平初速ありで空気抵抗が減速のみに働く", () => {
    let state: Swinger = {
      position: vec3(0, 100, 0),
      velocity: vec3(50, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    let prevSpeed = Math.abs(state.velocity.x);
    for (let i = 0; i < 50; i++) {
      state = advanceSwinger(state, 0.1, DEFAULT_TUNING);
      const currentSpeed = Math.abs(state.velocity.x);
      expect(currentSpeed).toBeLessThan(prevSpeed);
      expect(state.velocity.x).toBeGreaterThan(0);
      prevSpeed = currentSpeed;
    }
  });

  it("S3: 振り子がエネルギーを保存している（最下点での速すが解析値と 5% 以内で一致）", () => {
    const anchor = vec3(0, 100, 0);
    const dropHeight = 10;
    const initialPosition = vec3(dropHeight, 100, 0);

    let state: Swinger = {
      position: initialPosition,
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };
    state = attachRope(state, anchor, DEFAULT_TUNING);

    let maxSpeed = 0;
    for (let i = 0; i < 500; i++) {
      state = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING);
      const speed = length(state.velocity);
      if (speed > maxSpeed) {
        maxSpeed = speed;
      }
      if (state.position.x <= 0) {
        break;
      }
    }

    const theoreticalSpeed = Math.sqrt(2 * DEFAULT_TUNING.gravity * dropHeight);
    const relError = Math.abs(maxSpeed - theoreticalSpeed) / theoreticalSpeed;

    expect(relError).toBeLessThanOrEqual(0.05);
  });

  it("S4: 全ステップで距離拘束に一度も違反しない", () => {
    const anchor = vec3(0, 100, 0);
    const initialPosition = vec3(10, 100, 0);

    let state: Swinger = {
      position: initialPosition,
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };
    state = attachRope(state, anchor, DEFAULT_TUNING);
    const ropeLength = state.rope!.length;

    for (let i = 0; i < 300; i++) {
      state = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING);
      const dist = distance(state.position, anchor);
      expect(dist).toBeLessThanOrEqual(ropeLength + 1e-6);
    }
  });

  it("S5: 巻き取りにより rope.length が減少し minRopeLength を下回らない", () => {
    const anchor = vec3(0, 100, 0);
    const initialPosition = vec3(0, 90, 0);

    let state: Swinger = {
      position: initialPosition,
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };
    state = attachRope(state, anchor, DEFAULT_TUNING);

    const initialRopeLength = state.rope!.length;
    state = advanceSwinger(state, 2.0, DEFAULT_TUNING, { reeling: true });

    expect(state.rope!.length).toBeLessThan(initialRopeLength);
    expect(state.rope!.length).toBeGreaterThanOrEqual(DEFAULT_TUNING.minRopeLength);
  });

  it("S6: 解除時に慣性が保存される（速度の不連続なリセットが発生しない）", () => {
    const anchor = vec3(0, 100, 0);
    let state: Swinger = {
      position: vec3(10, 100, 0),
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };
    state = attachRope(state, anchor, DEFAULT_TUNING);

    for (let i = 0; i < 100; i++) {
      state = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING);
    }

    const speedBeforeDetach = length(state.velocity);
    const velBeforeDetach = state.velocity;

    const detachedState = detachRope(state);
    expect(detachedState.velocity).toEqual(velBeforeDetach);

    const nextState = advanceSwinger(detachedState, FIXED_DT, DEFAULT_TUNING);
    const expectedVelY =
      (velBeforeDetach.y - DEFAULT_TUNING.gravity * FIXED_DT) *
      (1 - DEFAULT_TUNING.drag * FIXED_DT);
    const expectedVelX = velBeforeDetach.x * (1 - DEFAULT_TUNING.drag * FIXED_DT);

    expect(nextState.velocity.x).toBeCloseTo(expectedVelX, 5);
    expect(nextState.velocity.y).toBeCloseTo(expectedVelY, 5);
    expect(length(nextState.velocity)).toBeCloseTo(speedBeforeDetach, 0);
  });

  it("S7: 地面より下に着く速度で落下しても地面を貫通しない", () => {
    const state: Swinger = {
      position: vec3(0, 0.5, 0),
      velocity: vec3(0, -50, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    const next = advanceSwinger(state, 0.1, DEFAULT_TUNING);

    expect(next.position.y).toBeGreaterThanOrEqual(DEFAULT_TUNING.groundY);
    expect(next.grounded).toBe(true);
  });

  it("S8: 接地状態で水平速度が単調減少する", () => {
    let state: Swinger = {
      position: vec3(0, DEFAULT_TUNING.groundY, 0),
      velocity: vec3(20, 0, 0),
      rope: null,
      grounded: true,
      accumulator: 0,
    };

    let prevSpeed = Math.abs(state.velocity.x);
    for (let i = 0; i < 10; i++) {
      state = advanceSwinger(state, 0.1, DEFAULT_TUNING);
      const currentSpeed = Math.abs(state.velocity.x);
      expect(currentSpeed).toBeLessThan(prevSpeed);
      prevSpeed = currentSpeed;
    }
  });

  it("S9: 固定ステップ積分がフレームレートに依存しない", () => {
    const initialState: Swinger = {
      position: vec3(5, 50, 0),
      velocity: vec3(10, -5, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    const resultA = advanceSwinger(initialState, 0.5, DEFAULT_TUNING);

    const step1 = advanceSwinger(initialState, 0.25, DEFAULT_TUNING);
    const resultB = advanceSwinger(step1, 0.25, DEFAULT_TUNING);

    expect(distance(resultA.position, resultB.position)).toBeLessThan(1e-6);
    expect(distance(resultA.velocity, resultB.velocity)).toBeLessThan(1e-6);
  });

  it("S10: 極端に大きい elapsed でもステップ数がクランプされ有限値を返す", () => {
    const initialState: Swinger = {
      position: vec3(0, 100, 0),
      velocity: vec3(10, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    const result = advanceSwinger(initialState, 10.0, DEFAULT_TUNING);

    expect(Number.isFinite(result.position.x)).toBe(true);
    expect(Number.isFinite(result.position.y)).toBe(true);
    expect(Number.isFinite(result.position.z)).toBe(true);
    expect(Number.isFinite(result.velocity.x)).toBe(true);
    expect(Number.isFinite(result.velocity.y)).toBe(true);
    expect(Number.isFinite(result.velocity.z)).toBe(true);
  });

  it("S11: 呼び出し前後で入力の Swinger / Vec3 が書き換えられていない（イミュータビリティ）", () => {
    const pos = vec3(10, 50, 0);
    const vel = vec3(5, -5, 0);
    const anchor = vec3(0, 50, 0);
    const initial: Swinger = Object.freeze({
      position: Object.freeze(pos),
      velocity: Object.freeze(vel),
      rope: null,
      grounded: false,
      accumulator: 0,
    });

    const attached = attachRope(initial, anchor, DEFAULT_TUNING);
    expect(initial.rope).toBeNull();
    expect(initial.position).toEqual({ x: 10, y: 50, z: 0 });

    const detached = detachRope(attached);
    expect(detached.rope).toBeNull();
    expect(attached.rope).not.toBeNull();

    const advanced = advanceSwinger(attached, 0.1, DEFAULT_TUNING, { reeling: true });
    expect(attached.position).toEqual({ x: 10, y: 50, z: 0 });
    expect(attached.velocity).toEqual({ x: 5, y: -5, z: 0 });
    expect(pos).toEqual({ x: 10, y: 50, z: 0 });
    expect(vel).toEqual({ x: 5, y: -5, z: 0 });
    expect(advanced).not.toBe(attached);
  });

  it("S12: elapsed = 1/144 で 144 回呼び出すと 1 秒ぶん進んだ状態と一致する (144Hz 対応)", () => {
    const initial: Swinger = {
      position: vec3(0, 100, 0),
      velocity: vec3(10, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    const expected = advanceSwinger(initial, 1.0, DEFAULT_TUNING);

    let state = initial;
    const dt144 = 1 / 144;
    for (let i = 0; i < 144; i++) {
      state = advanceSwinger(state, dt144, DEFAULT_TUNING);
    }

    expect(distance(state.position, expected.position)).toBeLessThan(1e-6);
    expect(distance(state.velocity, expected.velocity)).toBeLessThan(1e-6);
  });

  it("S13: elapsed = FIXED_DT * 1.5 を 2 回呼ぶと合計で 3 ステップぶん進む", () => {
    const initial: Swinger = {
      position: vec3(0, 100, 0),
      velocity: vec3(10, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    const expected = advanceSwinger(initial, FIXED_DT * 3, DEFAULT_TUNING);

    const step1 = advanceSwinger(initial, FIXED_DT * 1.5, DEFAULT_TUNING);
    const step2 = advanceSwinger(step1, FIXED_DT * 1.5, DEFAULT_TUNING);

    expect(distance(step2.position, expected.position)).toBeLessThan(1e-6);
    expect(distance(step2.velocity, expected.velocity)).toBeLessThan(1e-6);
  });

  it("S14: elapsed = 10.0 を多数回呼んでも accumulator が無限に増えず積み残しが溜まらない", () => {
    let state: Swinger = {
      position: vec3(0, 100, 0),
      velocity: vec3(10, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    for (let i = 0; i < 100; i++) {
      state = advanceSwinger(state, 10.0, DEFAULT_TUNING);
    }

    expect(state.accumulator).toBeLessThan(FIXED_DT);

    const nextState = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING);
    expect(nextState.accumulator).toBeLessThan(FIXED_DT);
  });

  it("S15: accumulator に端数が溜まった状態で attachRope / detachRope を呼ぶと accumulator が保持される", () => {
    const initial: Swinger = {
      position: vec3(10, 100, 0),
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
      accumulator: FIXED_DT * 0.5,
    };

    const anchor = vec3(0, 100, 0);
    const attached = attachRope(initial, anchor, DEFAULT_TUNING);
    expect(attached.accumulator).toBeCloseTo(FIXED_DT * 0.5, 9);

    const detached = detachRope(attached);
    expect(detached.accumulator).toBeCloseTo(FIXED_DT * 0.5, 9);
  });

  it("S16: アンカーが minRopeLength 未満の位置にあるとき attachRope が minRopeLength を設定する", () => {
    const anchor = vec3(0, 100, 0);
    const initial: Swinger = {
      position: vec3(1.0, 100, 0),
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    const attached = attachRope(initial, anchor, DEFAULT_TUNING);
    expect(attached.rope!.length).toBe(DEFAULT_TUNING.minRopeLength);
  });

  it("S17: 近距離アンカーの巻き取り処理でワイヤー長が一度も増加しない（単調非増加）", () => {
    const anchor = vec3(0, 100, 0);
    let state: Swinger = {
      position: vec3(1.0, 100, 0),
      velocity: vec3(0, 0, 0),
      rope: { anchor, length: 1.0 },
      grounded: false,
      accumulator: 0,
    };

    const initialLen = state.rope!.length;
    for (let i = 0; i < 10; i++) {
      state = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING, { reeling: true });
      expect(state.rope!.length).toBeLessThanOrEqual(initialLen);
    }
  });

  it("S18: 通常距離のアンカーからの巻き取りで従来通り減少し minRopeLength で下限クランプされる", () => {
    const anchor = vec3(0, 100, 0);
    let state: Swinger = {
      position: vec3(20, 100, 0),
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };
    state = attachRope(state, anchor, DEFAULT_TUNING);

    const startLen = state.rope!.length;
    for (let i = 0; i < 3; i++) {
      state = advanceSwinger(state, 1.0, DEFAULT_TUNING, { reeling: true });
    }

    expect(state.rope!.length).toBeLessThan(startLen);
    expect(state.rope!.length).toBe(DEFAULT_TUNING.minRopeLength);
  });

  // 狙ったビルに当たらないまま押しっぱなしにしていると、描画層は rope なしのまま
  // 毎フレーム reeling: true を渡してくる。ここが落ちると「撃ち損ねるとゲームが
  // 壊れる」になるので固定しておく。
  it("S19: ワイヤー未接続で reeling を指定しても壊れない", () => {
    const initial: Swinger = {
      position: vec3(0, 50, 0),
      velocity: vec3(10, 0, 0),
      rope: null,
      grounded: false,
      accumulator: 0,
    };

    const next = advanceSwinger(initial, 0.1, DEFAULT_TUNING, { reeling: true });

    expect(next.rope).toBeNull();
    expect(Number.isFinite(next.position.x)).toBe(true);
    expect(Number.isFinite(next.velocity.y)).toBe(true);
  });
});
