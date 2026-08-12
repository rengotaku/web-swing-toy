import * as THREE from "three";
import { advanceSwinger, DEFAULT_TUNING, stepCamera } from "../engine";
import type { CameraState, Swinger } from "../engine";
import { setupCity } from "./city";
import { createGameLoop } from "./loop";
import { setupScene } from "./scene";

export type Game = {
  dispose: () => void;
};

/**
 * ゲームエンジンと描画レイヤーを初期化してループを開始する。
 * React StrictMode での二重マウントに備え、dispose() で完全に後片付けを行う。
 */
export function createGame(container: HTMLElement): Game {
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

  // 3. Scene & City
  const sceneManager = setupScene();
  const cityManager = setupCity();
  sceneManager.scene.add(cityManager.mesh);

  // 4. Initial Game & Camera State
  let swinger: Swinger = {
    position: { x: 0, y: 30, z: 0 },
    velocity: { x: 0, y: 0, z: 15 },
    rope: null,
    grounded: false,
    accumulator: 0,
  };

  let cameraState: CameraState = {
    position: { x: 0, y: 35, z: -15 },
    lookAt: { x: 0, y: 30, z: 0 },
    fov: DEFAULT_TUNING.minFov,
  };

  cityManager.update(swinger.position);

  // 5. Resize handler
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

  // 6. Game Loop
  const loop = createGameLoop((dt) => {
    // 物理・プレイヤー位置更新
    swinger = advanceSwinger(swinger, dt, DEFAULT_TUNING);

    // ビル描画更新 (プレイヤー位置追従)
    cityManager.update(swinger.position);

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

    // 描画
    renderer.render(sceneManager.scene, camera);
  });

  loop.start();

  // 7. Clean up
  const dispose = () => {
    loop.stop();
    window.removeEventListener("resize", handleResize);
    resizeObserver.disconnect();

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
