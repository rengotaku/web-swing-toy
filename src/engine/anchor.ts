import type { Tuning } from "./tuning";
import { add, length, scale, type Vec3 } from "./vec3";
import { type Building, buildingsNear } from "./world";

export type Ray = Readonly<{ origin: Vec3; direction: Vec3 }>;
export type AnchorHit = Readonly<{
  point: Vec3;
  distance: number;
  building: Building;
}>;

function rayIntersectAABB(ray: Ray, b: Building): number | null {
  let tNear = -Infinity;
  let tFar = Infinity;

  const axes: Array<"x" | "y" | "z"> = ["x", "y", "z"];

  for (const axis of axes) {
    const dirComp = ray.direction[axis];
    const orgComp = ray.origin[axis];
    const minVal = b.min[axis];
    const maxVal = b.max[axis];

    if (Math.abs(dirComp) < 1e-12) {
      if (orgComp < minVal || orgComp > maxVal) {
        return null;
      }
    } else {
      const invD = 1 / dirComp;
      let t1 = (minVal - orgComp) * invD;
      let t2 = (maxVal - orgComp) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tNear = Math.max(tNear, t1);
      tFar = Math.min(tFar, t2);
    }
  }

  if (tNear > tFar || tFar < 0) {
    return null;
  }

  return tNear >= 0 ? tNear : tFar;
}

export function raycastBuildings(
  ray: Ray,
  buildings: readonly Building[],
  maxDistance: number
): AnchorHit | null {
  const dirLen = length(ray.direction);
  if (dirLen < 1e-12) {
    return null;
  }

  // 方向ベクトルを正規化して実距離 t で判定する (P2/A8/A9 対応)
  const normRay: Ray = {
    origin: ray.origin,
    direction: scale(ray.direction, 1 / dirLen),
  };

  let closestHit: AnchorHit | null = null;
  let minDistance = maxDistance;

  for (const b of buildings) {
    const t = rayIntersectAABB(normRay, b);
    if (t !== null && t >= 0 && t <= minDistance) {
      minDistance = t;
      const point = add(normRay.origin, scale(normRay.direction, t));
      closestHit = {
        point,
        distance: t,
        building: b,
      };
    }
  }

  return closestHit;
}

export function pickAnchor(ray: Ray, tuning: Tuning): AnchorHit | null {
  const buildings = buildingsNear(ray.origin, tuning.maxAnchorDistance, tuning);
  return raycastBuildings(ray, buildings, tuning.maxAnchorDistance);
}
