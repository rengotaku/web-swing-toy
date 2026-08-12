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
    };

    const next = advanceSwinger(initial, 1.0, DEFAULT_TUNING);

    expect(next.velocity.y).toBeLessThan(0);
    expect(next.position.y).toBeLessThan(100);
  });

  it("S2: ワイヤーなし・水平初速ありで空気抵抗が減速のみに働く", () => {
    let state: Swinger = {
      position: vec3(0, 100, 0),
      velocity: vec3(50, 0, 0),
      rope: null,
      grounded: false,
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
    const initialPosition = vec3(dropHeight, 100, 0); // 真横・同高さ

    let state: Swinger = {
      position: initialPosition,
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
    };
    state = attachRope(state, anchor);

    let maxSpeed = 0;
    // 最下点 (x が 0 以下に達する) まで進める
    for (let i = 0; i < 500; i++) {
      state = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING);
      const speed = length(state.velocity);
      if (speed > maxSpeed) {
        maxSpeed = speed;
      }
      // 最下点（x <= 0）を通過したら終了
      if (state.position.x <= 0) {
        break;
      }
    }

    // 解析的理論値 v = sqrt(2 * g * h)
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
    };
    state = attachRope(state, anchor);
    const ropeLength = state.rope!.length;

    for (let i = 0; i < 300; i++) {
      state = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING);
      const dist = distance(state.position, anchor);
      expect(dist).toBeLessThanOrEqual(ropeLength + 1e-6);
    }
  });

  it("S5: 巻き取りにより rope.length が減少し minRopeLength を下回らない", () => {
    const anchor = vec3(0, 100, 0);
    const initialPosition = vec3(0, 90, 0); // アンカーの下方 10m

    let state: Swinger = {
      position: initialPosition,
      velocity: vec3(0, 0, 0),
      rope: null,
      grounded: false,
    };
    state = attachRope(state, anchor);

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
    };
    state = attachRope(state, anchor);

    // 最下点付近まで進める
    for (let i = 0; i < 100; i++) {
      state = advanceSwinger(state, FIXED_DT, DEFAULT_TUNING);
    }

    const speedBeforeDetach = length(state.velocity);
    const velBeforeDetach = state.velocity;

    // ワイヤー解除
    const detachedState = detachRope(state);
    expect(detachedState.velocity).toEqual(velBeforeDetach);

    // 解除直後の 1 ステップ
    const nextState = advanceSwinger(detachedState, FIXED_DT, DEFAULT_TUNING);
    const expectedVelY =
      (velBeforeDetach.y - DEFAULT_TUNING.gravity * FIXED_DT) *
      (1 - DEFAULT_TUNING.drag * FIXED_DT);
    const expectedVelX = velBeforeDetach.x * (1 - DEFAULT_TUNING.drag * FIXED_DT);

    // 重力と空気抵抗以外の不自然な速度変化がないこと
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
    };

    // (a) dt = 0.5 で 1 回呼ぶ
    const resultA = advanceSwinger(initialState, 0.5, DEFAULT_TUNING);

    // (b) dt = 0.25 で 2 回呼ぶ
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
    });

    const attached = attachRope(initial, anchor);
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

  it("ワイヤー未接続状態での reeling オプション指定の安全動作", () => {
    const initial: Swinger = {
      position: vec3(0, 50, 0),
      velocity: vec3(10, 0, 0),
      rope: null,
      grounded: false,
    };

    const next = advanceSwinger(initial, 0.1, DEFAULT_TUNING, { reeling: true });
    expect(next.rope).toBeNull();
    expect(Number.isFinite(next.position.x)).toBe(true);
  });
});
