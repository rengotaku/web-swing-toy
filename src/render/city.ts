import * as THREE from "three";
import { buildingsNear, DEFAULT_TUNING, type Vec3 } from "../engine";

export type CityManager = {
  mesh: THREE.InstancedMesh;
  update: (center: Vec3) => void;
  dispose: () => void;
};

const MAX_BUILDINGS = 2000;
const DRAW_RADIUS = 200;
const COLOR_SKY_HIGH = "#1b2b52";

/**
 * プレイヤー周辺のビル群を InstancedMesh で描画・管理する。
 * ジオメトリ・マテリアル・行列計算用ダミーオブジェクトは保持・再利用し、毎フレームの GC を防ぐ。
 */
export function setupCity(): CityManager {
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLOR_SKY_HIGH),
    roughness: 0.8,
    metalness: 0.2,
  });

  const mesh = new THREE.InstancedMesh(boxGeometry, material, MAX_BUILDINGS);
  mesh.count = 0;

  // 毎フレームの Matrix4 / Object3D 生成を防ぐためのダミーオブジェクト
  const dummy = new THREE.Object3D();

  const update = (center: Vec3) => {
    const buildings = buildingsNear(center, DRAW_RADIUS, DEFAULT_TUNING);
    const count = Math.min(buildings.length, MAX_BUILDINGS);
    mesh.count = count;

    for (let i = 0; i < count; i++) {
      const b = buildings[i];
      const width = b.max.x - b.min.x;
      const height = b.max.y - b.min.y;
      const depth = b.max.z - b.min.z;

      dummy.position.set(
        (b.min.x + b.max.x) / 2,
        (b.min.y + b.max.y) / 2,
        (b.min.z + b.max.z) / 2
      );
      dummy.scale.set(width, height, depth);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  };

  const dispose = () => {
    boxGeometry.dispose();
    material.dispose();
    mesh.dispose();
  };

  return {
    mesh,
    update,
    dispose,
  };
}
