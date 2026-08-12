import { describe, expect, it } from "vitest";
import { DEFAULT_TUNING } from "./tuning";

describe("tuning", () => {
  it("provides default tuning values", () => {
    expect(DEFAULT_TUNING.gravity).toBeGreaterThan(0);
    expect(DEFAULT_TUNING.minRopeLength).toBeGreaterThan(0);
  });
});
