import type { Tuning } from "./tuning";
import { add, length, normalize, scale, sub, type Vec3 } from "./vec3";

export type CameraState = Readonly<{
  position: Vec3;
  lookAt: Vec3;
  fov: number;
}>;

export function stepCamera(
  prev: CameraState,
  target: { position: Vec3; velocity: Vec3 },
  dt: number,
  tuning: Tuning
): CameraState {
  if (dt <= 0) {
    return prev;
  }

  const horizVel = { x: target.velocity.x, y: 0, z: target.velocity.z };
  const horizSpeed = length(horizVel);

  let dir: Vec3;
  if (horizSpeed > 1e-4) {
    dir = normalize(horizVel);
  } else {
    const prevOffset = sub(target.position, prev.position);
    const prevHorizOffset = { x: prevOffset.x, y: 0, z: prevOffset.z };
    const prevHorizDist = length(prevHorizOffset);
    if (prevHorizDist > 1e-4) {
      dir = normalize(prevHorizOffset);
    } else {
      dir = { x: 0, y: 0, z: 1 };
    }
  }

  const idealPos: Vec3 = {
    x: target.position.x - dir.x * tuning.cameraDistance,
    y: target.position.y + tuning.cameraHeight,
    z: target.position.z - dir.z * tuning.cameraDistance,
  };

  const idealLookAt: Vec3 = target.position;

  const tau = Math.max(1e-5, tuning.cameraTau);
  const alpha = 1 - Math.exp(-dt / tau);

  const nextPos = add(prev.position, scale(sub(idealPos, prev.position), alpha));
  const nextLookAt = add(prev.lookAt, scale(sub(idealLookAt, prev.lookAt), alpha));

  const speed = length(target.velocity);
  const fallSpeed = Math.max(0, -target.velocity.y);

  const targetFov = Math.min(
    tuning.maxFov,
    Math.max(
      tuning.minFov,
      tuning.minFov + speed * tuning.fovSpeedGain + fallSpeed * tuning.fovFallGain
    )
  );

  const nextFov = prev.fov + (targetFov - prev.fov) * alpha;

  return {
    position: nextPos,
    lookAt: nextLookAt,
    fov: nextFov,
  };
}
