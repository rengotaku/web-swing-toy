import * as THREE from "three";
import type { Ray } from "../engine";

export type NDC = Readonly<{ x: number; y: number }>;

export type DOMRectLike = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

/**
 * ポインタのクライアント座標 (clientX, clientY) と要素の矩形情報から
 * 正規化デバイス座標 (NDC: x, y ∈ [-1, +1]) へ変換する純関数。
 * 境界:
 * - 左上 (left, top) → (-1, +1)
 * - 中央 (left + width/2, top + height/2) → (0, 0)
 * - 右下 (left + width, top + height) → (+1, -1)
 */
export function toNormalizedDeviceCoordinates(
  clientX: number,
  clientY: number,
  rect: DOMRectLike
): NDC {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 };
  }
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  return { x, y };
}

// 毎フレームの Raycaster / Vector2 生成を防ぐモジュール保持用オブジェクト
const reusableRaycaster = new THREE.Raycaster();
const reusableNDC = new THREE.Vector2();

/**
 * NDC 座標と PerspectiveCamera から engine 用の Ray ({ origin, direction }) を生成する。
 */
export function createRayFromPointer(ndc: NDC, camera: THREE.PerspectiveCamera): Ray {
  reusableNDC.set(ndc.x, ndc.y);
  reusableRaycaster.setFromCamera(reusableNDC, camera);
  const ray = reusableRaycaster.ray;
  return {
    origin: { x: ray.origin.x, y: ray.origin.y, z: ray.origin.z },
    direction: { x: ray.direction.x, y: ray.direction.y, z: ray.direction.z },
  };
}

export type PointerInputManager = {
  isPointerDown: () => boolean;
  getPointerNDC: () => NDC | null;
  dispose: () => void;
};

export type PointerCallbacks = {
  onPress?: (ndc: NDC) => void;
  onRelease?: () => void;
};

/**
 * コンテナ要素に対するポインタ各種イベントのバインドおよびコールバック管理を行う。
 */
export function setupPointerInput(
  container: HTMLElement,
  callbacks?: PointerCallbacks
): PointerInputManager {
  let isDown = false;
  let currentNDC: NDC | null = null;

  const handlePointerDown = (e: PointerEvent) => {
    isDown = true;
    const rect = container.getBoundingClientRect();
    currentNDC = toNormalizedDeviceCoordinates(e.clientX, e.clientY, rect);
    callbacks?.onPress?.(currentNDC);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDown) {
      const rect = container.getBoundingClientRect();
      currentNDC = toNormalizedDeviceCoordinates(e.clientX, e.clientY, rect);
    }
  };

  const handlePointerUp = () => {
    if (isDown) {
      isDown = false;
      currentNDC = null;
      callbacks?.onRelease?.();
    }
  };

  container.addEventListener("pointerdown", handlePointerDown);
  container.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);

  const dispose = () => {
    container.removeEventListener("pointerdown", handlePointerDown);
    container.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
  };

  return {
    isPointerDown: () => isDown,
    getPointerNDC: () => currentNDC,
    dispose,
  };
}
