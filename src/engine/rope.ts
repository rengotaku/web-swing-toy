import { add, dot, length, scale, sub, type Vec3 } from "./vec3";

export type Rope = Readonly<{ anchor: Vec3; length: number }>;

export function solveRope(
  position: Vec3,
  velocity: Vec3,
  rope: Rope
): { position: Vec3; velocity: Vec3 } {
  const offset = sub(position, rope.anchor);
  const dist = length(offset);

  // ワイヤーがたるんでいる間だけ非干渉。距離がワイヤー長と一致する「張った」状態は
  // 拘束が効いている状態なので、ここで抜けてはいけない（位置の射影は恒等になるが、
  // 外向きの速度は除去する必要がある。ワイヤーは押せないが、伸びもしない）。
  // 距離がほぼ 0 のときは方向が定まらないため零除算ガードとしてそのまま返す。
  if (dist < rope.length || dist < 1e-9) {
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
