import * as THREE from "three";
import { buildingsNear, DEFAULT_TUNING, type Vec3 } from "../engine";

export type CityManager = {
  mesh: THREE.InstancedMesh;
  update: (center: Vec3) => void;
  dispose: () => void;
};

const MAX_BUILDINGS = 2000;
// フォグの開始距離 (300m) より手前で街が途切れると、何も無い space に
// 建物が湧いて見える。フォグに溶ける距離まで描いてから消す。
const DRAW_RADIUS = 700;
const COLOR_INK = "#0b1020";

/**
 * プレイヤー周辺のビル群を InstancedMesh で描画・管理する。
 * ジオメトリ・マテリアル・行列計算用ダミーオブジェクトは保持・再利用し、毎フレームの GC を防ぐ。
 */
export function setupCity(): CityManager {
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  // 街は明るい水平線を背にした暗いシルエット。画面で唯一の高彩度は
  // ワイヤーだと決めてあるので、ビルは彩度を持たせず暗いまま置く。
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(COLOR_INK),
    roughness: 1,
    metalness: 0,
  });

  const mesh = new THREE.InstancedMesh(boxGeometry, material, MAX_BUILDINGS);
  mesh.count = 0;

  // このメッシュは常にプレイヤーの周囲に作り直されるので、メッシュ単位の
  // フラスタムカリングは利益が無い一方で害がある。InstancedMesh の
  // boundingSphere はインスタンス行列を書き換えても自動では追従しないため、
  // 有効なままだと、初期位置から離れたときに古い境界球で判定され
  // 「周囲にビルがあるはずなのに街ごと消える」ことになる（エラーは出ない）。
  mesh.frustumCulled = false;

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
