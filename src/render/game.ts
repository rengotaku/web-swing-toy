import * as THREE from "three";
import {
  advanceSwinger,
  attachRope,
  DEFAULT_TUNING,
  detachRope,
  pickAnchor,
  stepCamera,
} from "../engine";
import type { CameraState, Swinger } from "../engine";
import { createAnchorRay, setupPointerInput } from "../input/pointer";
import { setupCity } from "./city";
import { createGameLoop } from "./loop";
import { setupScene } from "./scene";
import { setupWire } from "./wire";

export type Game = {
  dispose: () => void;
};

/**
 * ゲームエンジンと描画レイヤーを初期化してループを開始する。
 * React StrictMode での二重マウントに備え、dispose() で完全に後片付けを行う。
 */
export function createGame(
  container: HTMLElement,
  hudElement?: HTMLElement | null
): Game {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  // 1. Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  // 2. Camera
  const camera = new THREE.PerspectiveCamera(
    DEFAULT_TUNING.minFov,
    width / Math.max(height, 1),
    0.1,
    2000
  );

  // 3. Scene, City & Wire
  const sceneManager = setupScene();
  const cityManager = setupCity();
  sceneManager.scene.add(cityManager.mesh);

  const wireManager = setupWire();
  sceneManager.scene.add(wireManager.mesh);

  // 4. Initial Game & Camera State (x: 6 で中心線を外し、y: 110 でビル群の上から落下猶予確保)
  let swinger: Swinger = {
    position: { x: 6, y: 110, z: 0 },
    velocity: { x: 0, y: 5, z: 15 },
    rope: null,
    grounded: false,
    accumulator: 0,
  };

  let cameraState: CameraState = {
    position: { x: 6, y: 115, z: -15 },
    lookAt: { x: 6, y: 110, z: 0 },
    fov: DEFAULT_TUNING.minFov,
  };

  cityManager.update(swinger.position);
  wireManager.update(swinger);

  // 5. Pointer Input setup
  const pointerInput = setupPointerInput(container, {
    onPress: (ndc) => {
      const ray = createAnchorRay(ndc, camera, swinger);
      const hit = pickAnchor(ray, DEFAULT_TUNING);
      if (hit) {
        swinger = attachRope(swinger, hit.point, DEFAULT_TUNING);
      }
    },
    onRelease: () => {
      swinger = detachRope(swinger);
    },
  });

  // 6. Resize handler
  const handleResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    if (w <= 0 || h <= 0) return;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };

  const resizeObserver = new ResizeObserver(() => {
    handleResize();
  });
  resizeObserver.observe(container);
  window.addEventListener("resize", handleResize);

  // 7. Game Loop
  const loop = createGameLoop((dt) => {
    const reeling = pointerInput.isPointerDown();

    // 物理・プレイヤー位置更新 (長押し中は reeling: true)
    swinger = advanceSwinger(swinger, dt, DEFAULT_TUNING, { reeling });

    // ビル描画更新 (プレイヤー位置追従)
    cityManager.update(swinger.position);

    // ワイヤー描画更新
    wireManager.update(swinger);

    // カメラ位置・FOV更新
    cameraState = stepCamera(
      cameraState,
      { position: swinger.position, velocity: swinger.velocity },
      dt,
      DEFAULT_TUNING
    );

    // Three.js カメラ反映
    camera.position.set(
      cameraState.position.x,
      cameraState.position.y,
      cameraState.position.z
    );
    camera.lookAt(cameraState.lookAt.x, cameraState.lookAt.y, cameraState.lookAt.z);

    if (camera.fov !== cameraState.fov) {
      camera.fov = cameraState.fov;
      camera.updateProjectionMatrix();
    }

    // 空の位置更新
    sceneManager.updateSkyPosition(camera.position);

    // HUD 表示更新 (速度・高度)
    if (hudElement) {
      const speed = Math.sqrt(
        swinger.velocity.x * swinger.velocity.x +
          swinger.velocity.y * swinger.velocity.y +
          swinger.velocity.z * swinger.velocity.z
      );
      const alt = Math.max(0, swinger.position.y);
      hudElement.textContent = `SPD: ${speed.toFixed(1)} m/s | ALT: ${alt.toFixed(1)} m`;
    }

    // 描画
    renderer.render(sceneManager.scene, camera);
  });

  loop.start();

  // 8. Clean up
  const dispose = () => {
    loop.stop();
    window.removeEventListener("resize", handleResize);
    resizeObserver.disconnect();

    pointerInput.dispose();
    wireManager.dispose();
    cityManager.dispose();
    sceneManager.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  };

  return {
    dispose,
  };
}
