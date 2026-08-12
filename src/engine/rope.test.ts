import { describe, expect, it } from "vitest";
import { type Rope, solveRope } from "./rope";
import { dot, length, normalize, sub, vec3 } from "./vec3";

describe("rope", () => {
  it("R1: 拘束が緩んでいる間は一切干渉しない", () => {
    const anchor = vec3(0, 0, 0);
    const rope: Rope = { anchor, length: 10 };
    const position = vec3(8, 0, 0);
    const velocity = vec3(1, 2, 3);

    const result = solveRope(position, velocity, rope);

    expect(result.position).toEqual(position);
    expect(result.velocity).toEqual(velocity);
  });

  it("R2: 位置がアンカーからちょうどワイヤー長の距離に射影される", () => {
    const anchor = vec3(0, 0, 0);
    const rope: Rope = { anchor, length: 10 };
    const position = vec3(14, 0, 0);
    const velocity = vec3(0, 0, 0);

    const result = solveRope(position, velocity, rope);

    const dist = length(sub(result.position, rope.anchor));
    expect(dist).toBeCloseTo(10, 9);
    expect(result.position.x).toBeCloseTo(10, 9);
    expect(result.position.y).toBeCloseTo(0, 9);
    expect(result.position.z).toBeCloseTo(0, 9);
  });

  it("R3: 速度の外向き径方向成分が除去される", () => {
    const anchor = vec3(0, 0, 0);
    const rope: Rope = { anchor, length: 10 };
    const position = vec3(14, 0, 0);
    const velocity = vec3(5, 0, 0);

    const result = solveRope(position, velocity, rope);

    const wireDir = normalize(sub(position, anchor));
    const radialVel = dot(result.velocity, wireDir);
    expect(radialVel).toBeCloseTo(0, 9);
  });

  it("R4: 接線方向の速度が変化しない", () => {
    const anchor = vec3(0, 0, 0);
    const rope: Rope = { anchor, length: 10 };
    const position = vec3(14, 0, 0);
    const velocity = vec3(0, 5, 0);

    const result = solveRope(position, velocity, rope);

    expect(result.velocity.x).toBeCloseTo(0, 9);
    expect(result.velocity.y).toBeCloseTo(5, 9);
    expect(result.velocity.z).toBeCloseTo(0, 9);
  });

  it("R5: 内向きの速度が変化しない", () => {
    const anchor = vec3(0, 0, 0);
    const rope: Rope = { anchor, length: 10 };
    const position = vec3(14, 0, 0);
    const velocity = vec3(-5, 0, 0);

    const result = solveRope(position, velocity, rope);

    expect(result.velocity.x).toBeCloseTo(-5, 9);
    expect(result.velocity.y).toBeCloseTo(0, 9);
    expect(result.velocity.z).toBeCloseTo(0, 9);
  });

  it("R6: 位置がアンカーと完全一致（距離 0）でも NaN/Infinity を返さない", () => {
    const anchor = vec3(0, 0, 0);
    const rope: Rope = { anchor, length: 10 };
    const position = vec3(0, 0, 0);
    const velocity = vec3(1, 2, 3);

    const result = solveRope(position, velocity, rope);

    expect(Number.isNaN(result.position.x)).toBe(false);
    expect(Number.isNaN(result.position.y)).toBe(false);
    expect(Number.isNaN(result.position.z)).toBe(false);
    expect(Number.isNaN(result.velocity.x)).toBe(false);
    expect(Number.isNaN(result.velocity.y)).toBe(false);
    expect(Number.isNaN(result.velocity.z)).toBe(false);

    expect(Number.isFinite(result.position.x)).toBe(true);
    expect(Number.isFinite(result.position.y)).toBe(true);
    expect(Number.isFinite(result.position.z)).toBe(true);
    expect(Number.isFinite(result.velocity.x)).toBe(true);
    expect(Number.isFinite(result.velocity.y)).toBe(true);
    expect(Number.isFinite(result.velocity.z)).toBe(true);
  });

  it("非軸平行（3次元斜め方向）における射影と外向き速度の除去", () => {
    const anchor = vec3(1, 2, 3);
    const rope: Rope = { anchor, length: 5 };
    // anchor から (3, 4, 0) 離れた位置 (距離 5 の 3 倍 = 15)
    const position = vec3(1 + 9, 2 + 12, 3); // 距離 15
    const velocity = vec3(3, 4, 10); // 径方向(3,4,0)に並行な成分 + 接線成分(0,0,10)

    const result = solveRope(position, velocity, rope);

    // 距離がちょうど 5 に射影される
    expect(length(sub(result.position, anchor))).toBeCloseTo(5, 9);
    // 接線成分 (0,0,10) は保存され、径方向成分は 0 になる
    expect(result.velocity.z).toBeCloseTo(10, 9);
    const wireDir = normalize(sub(position, anchor));
    expect(dot(result.velocity, wireDir)).toBeCloseTo(0, 9);
  });
});
