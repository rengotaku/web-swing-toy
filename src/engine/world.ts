import type { Tuning } from "./tuning";
import type { Vec3 } from "./vec3";

export type Building = Readonly<{ min: Vec3; max: Vec3 }>;

function hash2D(x: number, z: number, seed: number = 0): number {
  let h = (Math.imul(x, 0x1b873593) ^ Math.imul(z, 0x85ebca6b) ^ seed) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function buildingAt(
  cellX: number,
  cellZ: number,
  tuning: Tuning
): Building | null {
  const existVal = hash2D(cellX, cellZ, 0x1234);
  if (existVal > tuning.buildingDensity) {
    return null;
  }

  const startX = cellX * tuning.cellSize;
  const startZ = cellZ * tuning.cellSize;
  const margin = tuning.buildingMargin;

  const minX = startX + margin;
  const maxX = startX + tuning.cellSize - margin;
  const minZ = startZ + margin;
  const maxZ = startZ + tuning.cellSize - margin;

  const heightVal = hash2D(cellX, cellZ, 0x5678);
  const height =
    tuning.minBuildingHeight +
    heightVal * (tuning.maxBuildingHeight - tuning.minBuildingHeight);

  const minY = tuning.groundY;
  const maxY = tuning.groundY + height;

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}

export function buildingsNear(center: Vec3, radius: number, tuning: Tuning): Building[] {
  const minCellX = Math.floor((center.x - radius) / tuning.cellSize);
  const maxCellX = Math.floor((center.x + radius) / tuning.cellSize);
  const minCellZ = Math.floor((center.z - radius) / tuning.cellSize);
  const maxCellZ = Math.floor((center.z + radius) / tuning.cellSize);

  const result: Building[] = [];
  const radiusSq = radius * radius;

  for (let cx = minCellX; cx <= maxCellX; cx++) {
    for (let cz = minCellZ; cz <= maxCellZ; cz++) {
      const b = buildingAt(cx, cz, tuning);
      if (b !== null) {
        const closestX = Math.max(b.min.x, Math.min(center.x, b.max.x));
        const closestZ = Math.max(b.min.z, Math.min(center.z, b.max.z));
        const distSq = (closestX - center.x) ** 2 + (closestZ - center.z) ** 2;

        if (distSq <= radiusSq + 1e-6) {
          result.push(b);
        }
      }
    }
  }

  return result;
}
