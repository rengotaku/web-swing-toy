import { describe, expect, it } from "vitest";
import { DEFAULT_TUNING } from "./tuning";
import { vec3 } from "./vec3";
import { buildingAt, buildingsNear } from "./world";

describe("world", () => {
  it("W1: 任意のセル座標で buildingAt を 2 回呼ぶと完全に同じ結果を返す（決定論性）", () => {
    const res1 = buildingAt(5, -3, DEFAULT_TUNING);
    const res2 = buildingAt(5, -3, DEFAULT_TUNING);

    expect(res1).toEqual(res2);
  });

  it("W2: セル座標を 400 個走査したとき、ビルが存在するセルと存在しないセルがどちらもある", () => {
    let existCount = 0;
    let nullCount = 0;

    for (let x = 0; x < 20; x++) {
      for (let z = 0; z < 20; z++) {
        const b = buildingAt(x, z, DEFAULT_TUNING);
        if (b !== null) {
          existCount++;
        } else {
          nullCount++;
        }
      }
    }

    expect(existCount).toBeGreaterThan(0);
    expect(nullCount).toBeGreaterThan(0);
    expect(existCount + nullCount).toBe(400);
  });

  it("W3: 隣接する 2 セルのビルが水平方向に重ならない（セル内に収まっている）", () => {
    for (let x = 0; x < 10; x++) {
      for (let z = 0; z < 10; z++) {
        const b1 = buildingAt(x, z, DEFAULT_TUNING);
        const b2 = buildingAt(x + 1, z, DEFAULT_TUNING);
        if (b1 && b2) {
          expect(b1.max.x).toBeLessThanOrEqual(b2.min.x);
        }

        const b3 = buildingAt(x, z + 1, DEFAULT_TUNING);
        if (b1 && b3) {
          expect(b1.max.z).toBeLessThanOrEqual(b3.min.z);
        }
      }
    }
  });

  it("W4: 任意のビルで min/max が正しく、AABB が退化していない", () => {
    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        const b = buildingAt(x, z, DEFAULT_TUNING);
        if (b !== null) {
          expect(b.min.y).toBe(DEFAULT_TUNING.groundY);
          expect(b.max.y).toBeGreaterThan(b.min.y);
          expect(b.max.x).toBeGreaterThan(b.min.x);
          expect(b.max.z).toBeGreaterThan(b.min.z);
        }
      }
    }
  });

  it("W5: buildingsNear が指定半径内のすべてのビルを取りこぼしも過剰取得もなく返す", () => {
    const center = vec3(50, 0, 50);
    const radius = 35;

    const nearBuildings = buildingsNear(center, radius, DEFAULT_TUNING);

    for (const b of nearBuildings) {
      const closestX = Math.max(b.min.x, Math.min(center.x, b.max.x));
      const closestZ = Math.max(b.min.z, Math.min(center.z, b.max.z));
      const distSq = (closestX - center.x) ** 2 + (closestZ - center.z) ** 2;
      expect(distSq).toBeLessThanOrEqual(radius ** 2 + 1e-6);
    }

    const minCellX = Math.floor((center.x - radius) / DEFAULT_TUNING.cellSize);
    const maxCellX = Math.floor((center.x + radius) / DEFAULT_TUNING.cellSize);
    const minCellZ = Math.floor((center.z - radius) / DEFAULT_TUNING.cellSize);
    const maxCellZ = Math.floor((center.z + radius) / DEFAULT_TUNING.cellSize);

    let expectedCount = 0;
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cz = minCellZ; cz <= maxCellZ; cz++) {
        const b = buildingAt(cx, cz, DEFAULT_TUNING);
        if (b) {
          const closestX = Math.max(b.min.x, Math.min(center.x, b.max.x));
          const closestZ = Math.max(b.min.z, Math.min(center.z, b.max.z));
          const distSq = (closestX - center.x) ** 2 + (closestZ - center.z) ** 2;
          if (distSq <= radius ** 2 + 1e-6) {
            expectedCount++;
          }
        }
      }
    }

    expect(nearBuildings.length).toBe(expectedCount);
  });

  it("W6: 巨大な座標でも NaN を出さず有限値を返す", () => {
    const b = buildingAt(1e6, -1e6, DEFAULT_TUNING);
    if (b !== null) {
      expect(Number.isFinite(b.min.x)).toBe(true);
      expect(Number.isFinite(b.min.y)).toBe(true);
      expect(Number.isFinite(b.min.z)).toBe(true);
      expect(Number.isFinite(b.max.x)).toBe(true);
      expect(Number.isFinite(b.max.y)).toBe(true);
      expect(Number.isFinite(b.max.z)).toBe(true);

      expect(Number.isNaN(b.min.x)).toBe(false);
      expect(Number.isNaN(b.max.x)).toBe(false);
    }
  });

  it("負の大きな整数セル座標での決定論性と AABB 整合性", () => {
    const b1 = buildingAt(-100, -200, DEFAULT_TUNING);
    const b2 = buildingAt(-100, -200, DEFAULT_TUNING);

    expect(b1).toEqual(b2);
    if (b1 !== null) {
      expect(b1.min.x).toBeLessThan(b1.max.x);
      expect(b1.min.z).toBeLessThan(b1.max.z);
    }
  });
});
