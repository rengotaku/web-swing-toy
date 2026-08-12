import * as THREE from "three";
import type { Swinger } from "../engine";

export type WireManager = {
  mesh: THREE.Line;
  update: (swinger: Swinger) => void;
  dispose: () => void;
};

const NUM_POINTS = 16;
const COLOR_WIRE = "#7ef3d6";

/**
 * プレイヤーとアンカーを結ぶワイヤーの描画・更新を担当する。
 * ワイヤー接続中のみ表示し、たるみ (放物線) を持たせる。
 * 毎フレームの geometry 再生成を回避するため、BufferAttribute を再利用する。
 */
export function setupWire(): WireManager {
  const positions = new Float32Array(NUM_POINTS * 3);
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute("position", positionAttribute);

  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(COLOR_WIRE),
    linewidth: 2,
  });

  const mesh = new THREE.Line(geometry, material);
  mesh.visible = false;

  const update = (swinger: Swinger) => {
    if (!swinger.rope) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;

    const start = swinger.position;
    const end = swinger.rope.anchor;
    const ropeLen = swinger.rope.length;

    // 現在の直線距離
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // ワイヤーのゆるみ量 (実長 - 直線距離。張っている時も若干の自重たるみ)
    const slack = Math.max(0, ropeLen - dist);
    const sag = slack + 0.2;

    const array = positionAttribute.array as Float32Array;

    for (let i = 0; i < NUM_POINTS; i++) {
      const t = i / (NUM_POINTS - 1);

      // 直線補間
      const lx = start.x + dx * t;
      const ly = start.y + dy * t;
      const lz = start.z + dz * t;

      // 4 * t * (1 - t) は t=0.5 で最大 1 となる放物線たるみ
      const sagOffset = 4 * t * (1 - t) * sag;

      array[i * 3] = lx;
      array[i * 3 + 1] = ly - sagOffset;
      array[i * 3 + 2] = lz;
    }

    positionAttribute.needsUpdate = true;
    geometry.computeBoundingSphere();
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };

  return {
    mesh,
    update,
    dispose,
  };
}
