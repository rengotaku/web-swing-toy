import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { vec3ToVector3, vector3ToVec3 } from "../render/math";
import type { Vec3 } from "../engine";

describe("math conversion helpers", () => {
  it("converts Vec3 to Vector3", () => {
    const v: Vec3 = { x: 1, y: 2, z: 3 };
    const res = vec3ToVector3(v);
    expect(res).toBeInstanceOf(THREE.Vector3);
    expect(res.x).toBe(1);
    expect(res.y).toBe(2);
    expect(res.z).toBe(3);
  });

  it("converts Vec3 to target Vector3 in place", () => {
    const v: Vec3 = { x: 4, y: 5, z: 6 };
    const target = new THREE.Vector3();
    const res = vec3ToVector3(v, target);
    expect(res).toBe(target);
    expect(target.x).toBe(4);
    expect(target.y).toBe(5);
    expect(target.z).toBe(6);
  });

  it("converts Vector3 to Vec3", () => {
    const v3 = new THREE.Vector3(7, 8, 9);
    const res = vector3ToVec3(v3);
    expect(res).toEqual({ x: 7, y: 8, z: 9 });
  });
});
