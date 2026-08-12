import { describe, expect, it, vi } from "vitest";
import { isWebGLAvailable } from "./webgl";

describe("isWebGLAvailable", () => {
  it("G1: returns true when getContext returns a WebGL2 context", () => {
    const mockCanvas = {
      getContext: vi.fn((contextId: string) => {
        if (contextId === "webgl2") {
          return {} as WebGL2RenderingContext;
        }
        return null;
      }),
    } as unknown as HTMLCanvasElement;

    expect(isWebGLAvailable(mockCanvas)).toBe(true);
  });

  it("G2: returns true when getContext returns null for WebGL2 but returns a context for WebGL1", () => {
    const mockCanvas = {
      getContext: vi.fn((contextId: string) => {
        if (contextId === "webgl") {
          return {} as WebGLRenderingContext;
        }
        return null;
      }),
    } as unknown as HTMLCanvasElement;

    expect(isWebGLAvailable(mockCanvas)).toBe(true);
  });

  it("G3: returns false when getContext always returns null", () => {
    const mockCanvas = {
      getContext: vi.fn(() => null),
    } as unknown as HTMLCanvasElement;

    expect(isWebGLAvailable(mockCanvas)).toBe(false);
  });

  it("G4: returns false without throwing when getContext throws an exception", () => {
    const mockCanvas = {
      getContext: vi.fn(() => {
        throw new Error("WebGL creation context lost or disabled");
      }),
    } as unknown as HTMLCanvasElement;

    expect(() => {
      const result = isWebGLAvailable(mockCanvas);
      expect(result).toBe(false);
    }).not.toThrow();
  });

  it("returns false when canvas is null or getContext method is absent", () => {
    expect(isWebGLAvailable(null)).toBe(false);
    expect(isWebGLAvailable({} as unknown as HTMLCanvasElement)).toBe(false);
  });

  it("returns false without throwing when canvas property evaluation throws", () => {
    const invalidCanvas = {
      get getContext() {
        throw new Error("Property getter thrown");
      },
    } as unknown as HTMLCanvasElement;

    expect(isWebGLAvailable(invalidCanvas)).toBe(false);
  });
});
