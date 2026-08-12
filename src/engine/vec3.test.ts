import { describe, expect, it } from "vitest";
import { add, distance, dot, length, normalize, scale, sub, vec3 } from "./vec3";

describe("vec3", () => {
  it("creates a vec3 object", () => {
    const v = vec3(1, 2, 3);
    expect(v).toEqual({ x: 1, y: 2, z: 3 });
  });

  it("adds two vectors without mutating inputs", () => {
    const a = vec3(1, 2, 3);
    const b = vec3(4, 5, 6);
    const result = add(a, b);
    expect(result).toEqual({ x: 5, y: 7, z: 9 });
    expect(a).toEqual({ x: 1, y: 2, z: 3 });
    expect(b).toEqual({ x: 4, y: 5, z: 6 });
  });

  it("subtracts two vectors without mutating inputs", () => {
    const a = vec3(5, 7, 9);
    const b = vec3(1, 2, 3);
    const result = sub(a, b);
    expect(result).toEqual({ x: 4, y: 5, z: 6 });
    expect(a).toEqual({ x: 5, y: 7, z: 9 });
    expect(b).toEqual({ x: 1, y: 2, z: 3 });
  });

  it("scales a vector", () => {
    const a = vec3(1, -2, 3);
    const result = scale(a, 2);
    expect(result).toEqual({ x: 2, y: -4, z: 6 });
  });

  it("calculates dot product", () => {
    const a = vec3(1, 2, 3);
    const b = vec3(4, -5, 6);
    expect(dot(a, b)).toBe(1 * 4 + 2 * -5 + 3 * 6); // 4 - 10 + 18 = 12
  });

  it("calculates vector length", () => {
    const a = vec3(3, 4, 0);
    expect(length(a)).toBe(5);
  });

  it("normalizes a non-zero vector", () => {
    const a = vec3(0, 3, 4);
    const norm = normalize(a);
    expect(norm.x).toBeCloseTo(0);
    expect(norm.y).toBeCloseTo(0.6);
    expect(norm.z).toBeCloseTo(0.8);
  });

  it("returns zero vector when normalizing zero vector", () => {
    const zero = vec3(0, 0, 0);
    expect(normalize(zero)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("calculates distance between two vectors", () => {
    const a = vec3(1, 2, 3);
    const b = vec3(4, 6, 3);
    expect(distance(a, b)).toBe(5);
  });

  it("returns zero vector when normalizing tiny near-zero vector", () => {
    const tiny = vec3(1e-15, 1e-15, 1e-15);
    expect(normalize(tiny)).toEqual({ x: 0, y: 0, z: 0 });
  });
});
