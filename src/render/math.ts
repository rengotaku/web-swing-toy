import * as THREE from "three";
import type { Vec3 } from "../engine";

/**
 * Vec3 (engine) を Three.js の Vector3 に変換する。
 * target を渡すことで毎フレームの Vector3 インスタンス生成を防ぐ。
 */
export function vec3ToVector3(
  v: Vec3,
  target: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 {
  return target.set(v.x, v.y, v.z);
}

/**
 * Three.js の Vector3 を Vec3 (engine) に変換する。
 */
export function vector3ToVec3(v: THREE.Vector3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}
