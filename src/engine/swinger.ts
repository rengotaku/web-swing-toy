import { type Rope, solveRope } from "./rope";
import type { Tuning } from "./tuning";
import { add, distance, scale, type Vec3 } from "./vec3";

export type Swinger = Readonly<{
  position: Vec3;
  velocity: Vec3;
  rope: Rope | null;
  grounded: boolean;
  accumulator: number;
}>;

export const FIXED_DT = 1 / 120;

export function attachRope(state: Swinger, anchor: Vec3, tuning: Tuning): Swinger {
  const dist = distance(state.position, anchor);
  return {
    ...state,
    rope: {
      anchor,
      length: Math.max(dist, tuning.minRopeLength),
    },
    accumulator: state.accumulator ?? 0,
  };
}

export function detachRope(state: Swinger): Swinger {
  return {
    ...state,
    rope: null,
    accumulator: state.accumulator ?? 0,
  };
}

/** elapsed を FIXED_DT で分割して積分する。elapsed は上限でクランプする。 */
export function advanceSwinger(
  state: Swinger,
  elapsed: number,
  tuning: Tuning,
  opts?: { reeling?: boolean }
): Swinger {
  // 1. elapsed を先に maxElapsed でクランプする
  const clampedElapsed = Math.max(0, Math.min(elapsed, tuning.maxElapsed));

  // 2. クランプ後の値を accumulator に加算する
  const accum = (state.accumulator ?? 0) + clampedElapsed;

  // 3. 消費ステップ数と繰り越し accumulator を算出する（浮動小数点誤差の 1e-9 イプシロン補正）
  const numSteps = Math.floor((accum + 1e-9) / FIXED_DT);

  let stepsToRun: number;
  let nextAccumulator: number;

  if (numSteps > tuning.maxSubSteps) {
    stepsToRun = tuning.maxSubSteps;
    nextAccumulator = 0;
  } else {
    stepsToRun = numSteps;
    nextAccumulator = Math.max(0, accum - stepsToRun * FIXED_DT);
  }

  if (stepsToRun <= 0) {
    return {
      ...state,
      accumulator: nextAccumulator,
    };
  }

  let pos = state.position;
  let vel = state.velocity;
  let rope = state.rope;
  let grounded = state.grounded;

  for (let step = 0; step < stepsToRun; step++) {
    // 1. 重力を速度に積む
    vel = {
      x: vel.x,
      y: vel.y - tuning.gravity * FIXED_DT,
      z: vel.z,
    };

    // 2. 空気抵抗を速度に掛ける
    const dragFactor = Math.max(0, 1 - tuning.drag * FIXED_DT);
    vel = scale(vel, dragFactor);

    // 3. 巻き取り中ならワイヤー長を縮める（現在長を上限とし、minRopeLength で下限クランプ。P2-b 対応）
    if (opts?.reeling && rope !== null) {
      const newLength = Math.min(
        rope.length,
        Math.max(tuning.minRopeLength, rope.length - tuning.reelSpeed * FIXED_DT)
      );
      rope = {
        anchor: rope.anchor,
        length: newLength,
      };
    }

    // 4. 速度で位置を進める
    pos = add(pos, scale(vel, FIXED_DT));

    // 5. ワイヤーがあれば距離拘束を解く
    if (rope !== null) {
      const solved = solveRope(pos, vel, rope);
      pos = solved.position;
      vel = solved.velocity;
    }

    // 6. 地面との接触を処理する
    if (pos.y <= tuning.groundY) {
      pos = { x: pos.x, y: tuning.groundY, z: pos.z };
      grounded = true;
      if (vel.y < 0) {
        vel = { x: vel.x, y: 0, z: vel.z };
      }
      const frictionFactor = Math.max(0, 1 - tuning.groundFriction * FIXED_DT);
      vel = {
        x: vel.x * frictionFactor,
        y: vel.y,
        z: vel.z * frictionFactor,
      };
    } else {
      grounded = false;
    }
  }

  return {
    position: pos,
    velocity: vel,
    rope,
    grounded,
    accumulator: nextAccumulator,
  };
}
