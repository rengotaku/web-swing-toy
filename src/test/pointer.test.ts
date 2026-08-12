import { describe, expect, it } from "vitest";
import { toNormalizedDeviceCoordinates } from "../input/pointer";

describe("toNormalizedDeviceCoordinates", () => {
  const rect = { left: 100, top: 50, width: 800, height: 600 };

  it("converts top-left corner to (-1, +1)", () => {
    const res = toNormalizedDeviceCoordinates(100, 50, rect);
    expect(res.x).toBeCloseTo(-1);
    expect(res.y).toBeCloseTo(1);
  });

  it("converts center to (0, 0)", () => {
    const res = toNormalizedDeviceCoordinates(500, 350, rect);
    expect(res.x).toBeCloseTo(0);
    expect(res.y).toBeCloseTo(0);
  });

  it("converts bottom-right corner to (+1, -1)", () => {
    const res = toNormalizedDeviceCoordinates(900, 650, rect);
    expect(res.x).toBeCloseTo(1);
    expect(res.y).toBeCloseTo(-1);
  });

  it("handles zero dimension safely without NaN", () => {
    const zeroRect = { left: 0, top: 0, width: 0, height: 0 };
    const res = toNormalizedDeviceCoordinates(10, 10, zeroRect);
    expect(res).toEqual({ x: 0, y: 0 });
  });
});
