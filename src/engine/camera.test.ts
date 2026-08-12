import { describe, expect, it } from "vitest";
import { type CameraState, stepCamera } from "./camera";
import { DEFAULT_TUNING } from "./tuning";
import { distance, vec3 } from "./vec3";

describe("camera", () => {
  const initialCam: CameraState = {
    position: vec3(0, 5, -15),
    lookAt: vec3(0, 0, 0),
    fov: 60,
  };

  it("C1: 高速移動時の方が静止時よりも FOV が大きくなる", () => {
    const targetSlow = { position: vec3(0, 0, 0), velocity: vec3(0, 0, 0) };
    const targetFast = { position: vec3(0, 0, 0), velocity: vec3(50, 0, 0) };

    const stateSlow = stepCamera(initialCam, targetSlow, 0.1, DEFAULT_TUNING);
    const stateFast = stepCamera(initialCam, targetFast, 0.1, DEFAULT_TUNING);

    expect(stateFast.fov).toBeGreaterThan(stateSlow.fov);
  });

  it("C2: 速度を上げ続けても fov が maxFov でクランプされる", () => {
    const targetExtreme = {
      position: vec3(0, 0, 0),
      velocity: vec3(1000, -1000, 0),
    };

    let cam = initialCam;
    for (let i = 0; i < 20; i++) {
      cam = stepCamera(cam, targetExtreme, 0.1, DEFAULT_TUNING);
    }

    expect(cam.fov).toBeLessThanOrEqual(DEFAULT_TUNING.maxFov);
  });

  it("C3: 同じ水平速さの場合、落下中の方が水平飛行中よりも FOV が大きい", () => {
    const targetHorizontal = {
      position: vec3(0, 0, 0),
      velocity: vec3(30, 0, 0),
    };
    const targetFalling = {
      position: vec3(0, 0, 0),
      velocity: vec3(30, -30, 0),
    };

    let camHoriz = initialCam;
    let camFall = initialCam;

    for (let i = 0; i < 10; i++) {
      camHoriz = stepCamera(camHoriz, targetHorizontal, 0.1, DEFAULT_TUNING);
      camFall = stepCamera(camFall, targetFalling, 0.1, DEFAULT_TUNING);
    }

    expect(camFall.fov).toBeGreaterThan(camHoriz.fov);
  });

  it("C4: 目標が静止しているとカメラ位置が理想的な追従点へ収束する", () => {
    const target = { position: vec3(0, 0, 0), velocity: vec3(0, 0, 0) };

    let cam = initialCam;
    for (let i = 0; i < 100; i++) {
      cam = stepCamera(cam, target, 0.1, DEFAULT_TUNING);
    }

    const idealPos = vec3(
      target.position.x,
      target.position.y + DEFAULT_TUNING.cameraHeight,
      target.position.z - DEFAULT_TUNING.cameraDistance
    );

    expect(distance(cam.position, idealPos)).toBeLessThan(1e-3);
    expect(distance(cam.lookAt, target.position)).toBeLessThan(1e-3);
  });

  it("C5: 目標が瞬間移動した直後、1 ステップでは到達せず遅延が存在する", () => {
    const target = { position: vec3(100, 50, 100), velocity: vec3(0, 0, 0) };

    const nextCam = stepCamera(initialCam, target, 0.01, DEFAULT_TUNING);

    const idealPos = vec3(
      target.position.x,
      target.position.y + DEFAULT_TUNING.cameraHeight,
      target.position.z - DEFAULT_TUNING.cameraDistance
    );

    expect(distance(nextCam.position, idealPos)).toBeGreaterThan(1.0);
  });

  it("C6: 平滑化がフレームレート非依存である（dt=0.1 で 1 回 vs dt=0.05 で 2 回が 2% 以内で一致）", () => {
    const target = { position: vec3(10, 0, 10), velocity: vec3(20, -5, 0) };

    const resA = stepCamera(initialCam, target, 0.1, DEFAULT_TUNING);

    const step1 = stepCamera(initialCam, target, 0.05, DEFAULT_TUNING);
    const resB = stepCamera(step1, target, 0.05, DEFAULT_TUNING);

    const posDiff = distance(resA.position, resB.position);
    const posDistFromStart = distance(initialCam.position, resA.position);
    const relErrorPos = posDiff / (posDistFromStart + 1e-6);

    expect(relErrorPos).toBeLessThanOrEqual(0.02);

    const lookAtDiff = distance(resA.lookAt, resB.lookAt);
    const lookAtDistFromStart = distance(initialCam.lookAt, resA.lookAt);
    const relErrorLookAt = lookAtDiff / (lookAtDistFromStart + 1e-6);

    expect(relErrorLookAt).toBeLessThanOrEqual(0.02);
  });

  it("dt <= 0 または完全静止時の安定性と前フレーム向き保持", () => {
    const targetZero = { position: vec3(0, 0, 0), velocity: vec3(0, 0, 0) };

    const sameCam = stepCamera(initialCam, targetZero, 0, DEFAULT_TUNING);
    expect(sameCam).toBe(initialCam);

    const nextCam = stepCamera(initialCam, targetZero, 0.1, DEFAULT_TUNING);
    expect(Number.isNaN(nextCam.position.x)).toBe(false);
    expect(Number.isNaN(nextCam.position.y)).toBe(false);
    expect(Number.isNaN(nextCam.position.z)).toBe(false);
  });
});
