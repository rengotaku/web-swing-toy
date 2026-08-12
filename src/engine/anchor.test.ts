import { describe, expect, it } from "vitest";
import { type Ray, pickAnchor, raycastBuildings } from "./anchor";
import { DEFAULT_TUNING } from "./tuning";
import { vec3 } from "./vec3";
import type { Building } from "./world";

describe("anchor", () => {
  const building1: Building = {
    min: vec3(10, 0, -5),
    max: vec3(20, 30, 5),
  };

  const building2: Building = {
    min: vec3(30, 0, -5),
    max: vec3(40, 30, 5),
  };

  it("A1: 単一の AABB に正面から当たる ray で手前の面上の点と正確な距離を返す", () => {
    const ray: Ray = {
      origin: vec3(0, 10, 0),
      direction: vec3(1, 0, 0),
    };

    const hit = raycastBuildings(ray, [building1], 100);

    expect(hit).not.toBeNull();
    expect(hit!.distance).toBeCloseTo(10, 6);
    expect(hit!.point.x).toBeCloseTo(10, 6);
    expect(hit!.point.y).toBeCloseTo(10, 6);
    expect(hit!.point.z).toBeCloseTo(0, 6);
    expect(hit!.building).toBe(building1);
  });

  it("A2: AABB を外す ray では null を返す", () => {
    const ray: Ray = {
      origin: vec3(0, 10, 0),
      direction: vec3(0, 1, 0),
    };

    const hit = raycastBuildings(ray, [building1], 100);
    expect(hit).toBeNull();
  });

  it("A3: 一直線上に 2 つの AABB がある場合、手前の AABB を返す", () => {
    const ray: Ray = {
      origin: vec3(0, 10, 0),
      direction: vec3(1, 0, 0),
    };

    const hit = raycastBuildings(ray, [building2, building1], 100);

    expect(hit).not.toBeNull();
    expect(hit!.building).toBe(building1);
    expect(hit!.distance).toBeCloseTo(10, 6);
  });

  it("A4: 当たるが maxDistance より遠い場合は null を返す", () => {
    const ray: Ray = {
      origin: vec3(0, 10, 0),
      direction: vec3(1, 0, 0),
    };

    const hit = raycastBuildings(ray, [building1], 5.0);
    expect(hit).toBeNull();
  });

  it("A5: ray の原点が AABB の内側にある場合、null を返さず有限の結果を返す", () => {
    const ray: Ray = {
      origin: vec3(15, 10, 0),
      direction: vec3(1, 0, 0),
    };

    const hit = raycastBuildings(ray, [building1], 100);

    expect(hit).not.toBeNull();
    expect(Number.isFinite(hit!.distance)).toBe(true);
    expect(Number.isNaN(hit!.distance)).toBe(false);
    expect(hit!.distance).toBeGreaterThanOrEqual(0);
  });

  it("A6: ray が AABB の背面方向を向いている場合は null を返す", () => {
    const ray: Ray = {
      origin: vec3(0, 10, 0),
      direction: vec3(-1, 0, 0),
    };

    const hit = raycastBuildings(ray, [building1], 100);
    expect(hit).toBeNull();
  });

  it("A7: ray の方向成分に 0 が含まれる（軸平行）場合でも NaN を出さず正しく判定する", () => {
    const ray: Ray = {
      origin: vec3(0, 10, 0),
      direction: vec3(1, 0, 0),
    };

    const hit = raycastBuildings(ray, [building1], 100);

    expect(hit).not.toBeNull();
    expect(Number.isNaN(hit!.distance)).toBe(false);
    expect(Number.isNaN(hit!.point.x)).toBe(false);
    expect(Number.isNaN(hit!.point.y)).toBe(false);
    expect(Number.isNaN(hit!.point.z)).toBe(false);
    expect(hit!.distance).toBeCloseTo(10, 6);
  });

  it("pickAnchor が近傍ビルを集めて正しく判定する", () => {
    const ray: Ray = {
      origin: vec3(0, 10, 0),
      direction: vec3(1, 0, 0),
    };

    const hit = pickAnchor(ray, DEFAULT_TUNING);
    if (hit !== null) {
      expect(Number.isFinite(hit.distance)).toBe(true);
      expect(hit.distance).toBeLessThanOrEqual(DEFAULT_TUNING.maxAnchorDistance);
    }
  });

  it("斜め方向 ray の AABB 交差判定と正確な交差点座標の計算", () => {
    const b: Building = {
      min: vec3(10, 0, 10),
      max: vec3(20, 20, 20),
    };

    const invSqrt2 = 1 / Math.SQRT2;
    const ray: Ray = {
      origin: vec3(0, 5, 0),
      direction: vec3(invSqrt2, 0, invSqrt2), // XZ 平面の斜め 45 度
    };

    const hit = raycastBuildings(ray, [b], 100);
    expect(hit).not.toBeNull();
    expect(hit!.point.x).toBeCloseTo(10, 5);
    expect(hit!.point.z).toBeCloseTo(10, 5);
    expect(hit!.distance).toBeCloseTo(10 * Math.SQRT2, 5);
  });
});
