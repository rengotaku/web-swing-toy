import { add, dot, length, scale, sub, type Vec3 } from "./vec3";

export type Rope = Readonly<{ anchor: Vec3; length: number }>;

export function solveRope(
  position: Vec3,
  velocity: Vec3,
  rope: Rope
): { position: Vec3; velocity: Vec3 } {
  const offset = sub(position, rope.anchor);
  const dist = length(offset);

  // 距離がワイヤー長以下の場合は拘束が働かないためそのまま返す
  // 距離がほぼ 0 (零除算ガード) の場合も同様にそのまま返す
  if (dist <= rope.length || dist < 1e-9) {
    return { position, velocity };
  }

  // 位置をアンカーからワイヤー長の距離に射影
  const dir = scale(offset, 1 / dist);
  const newPosition = add(rope.anchor, scale(dir, rope.length));

  // 速度の外向き径方向成分を除去
  const radialSpeed = dot(velocity, dir);
  let newVelocity = velocity;
  if (radialSpeed > 0) {
    newVelocity = sub(velocity, scale(dir, radialSpeed));
  }

  return { position: newPosition, velocity: newVelocity };
}
