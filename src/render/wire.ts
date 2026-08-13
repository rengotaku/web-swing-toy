import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { Swinger } from "../engine";

export type WireManager = {
  mesh: Line2;
  update: (swinger: Swinger) => void;
  setLineWidth: (widthPx: number) => void;
  setResolution: (width: number, height: number) => void;
  dispose: () => void;
};

const NUM_POINTS = 16;
const COLOR_WIRE = "#7ef3d6";

/**
 * プレイヤーとアンカーを結ぶワイヤーの描画・更新を担当する。
 * Line2 / LineGeometry / LineMaterial を使用し画面ピクセル単位の実幅を持つ。
 * 毎フレームの geometry 再生成を回避するため、positions Float32Array を使い回す。
 */
export function setupWire(initialWidth?: number, initialHeight?: number): WireManager {
  const w = initialWidth ?? (typeof window !== "undefined" ? window.innerWidth : 1024);
  const h = initialHeight ?? (typeof window !== "undefined" ? window.innerHeight : 768);

  const geometry = new LineGeometry();
  const positions = new Float32Array(NUM_POINTS * 3);
  geometry.setPositions(positions);

  const material = new LineMaterial({
    color: new THREE.Color(COLOR_WIRE).getHex(),
    linewidth: 3,
    worldUnits: false,
  });
  material.resolution.set(w, Math.max(h, 1));

  const mesh = new Line2(geometry, material);
  mesh.visible = false;
  // 視錐台判定はこのメッシュでは使わない（常にプレイヤーの手元にあり、
  // 境界球を毎フレーム測り直すほうが無駄）。
  mesh.frustumCulled = false;

  // LineGeometry.setPositions() は呼ぶたびに新しい InstancedInterleavedBuffer を
  // 確保する。ワイヤーを繋いでいる間は毎フレーム呼ばれるので、そのままだと
  // 属性と WebGL バッファの再確保が延々と続き、長く遊ぶほどメモリが増えて
  // 描画が定期的にカクつく。
  //
  // 点の数は固定なので、初回だけ setPositions で確保し、以降は確保済みの
  // インターリーブ配列へ直接書いて needsUpdate を立てる。
  // LineSegmentsGeometry の並びは 1 セグメントあたり [startXYZ, endXYZ]。
  // 上のコンストラクタで setPositions 済みなので、以降は書き込みのみでよい。
  let allocated = true;
  const writePositions = () => {
    if (!allocated) {
      geometry.setPositions(positions);
      allocated = true;
      return;
    }
    const attr = geometry.getAttribute(
      "instanceStart"
    ) as THREE.InterleavedBufferAttribute;
    const arr = attr.data.array as Float32Array;
    for (let seg = 0; seg < NUM_POINTS - 1; seg++) {
      const a = seg * 3;
      const b = (seg + 1) * 3;
      const o = seg * 6;
      arr[o] = positions[a];
      arr[o + 1] = positions[a + 1];
      arr[o + 2] = positions[a + 2];
      arr[o + 3] = positions[b];
      arr[o + 4] = positions[b + 1];
      arr[o + 5] = positions[b + 2];
    }
    attr.data.needsUpdate = true;
  };

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

    for (let i = 0; i < NUM_POINTS; i++) {
      const t = i / (NUM_POINTS - 1);

      // 直線補間
      const lx = start.x + dx * t;
      const ly = start.y + dy * t;
      const lz = start.z + dz * t;

      // 4 * t * (1 - t) は t=0.5 で最大 1 となる放物線たるみ
      const sagOffset = 4 * t * (1 - t) * sag;

      positions[i * 3] = lx;
      positions[i * 3 + 1] = ly - sagOffset;
      positions[i * 3 + 2] = lz;
    }

    writePositions();
  };

  const setLineWidth = (widthPx: number) => {
    material.linewidth = widthPx;
  };

  const setResolution = (width: number, height: number) => {
    material.resolution.set(width, Math.max(height, 1));
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };

  return {
    mesh,
    update,
    setLineWidth,
    setResolution,
    dispose,
  };
}
