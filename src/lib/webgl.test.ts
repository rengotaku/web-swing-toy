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

  it("G2': returns false when getContext returns null for WebGL2 even if WebGL1 context is available", () => {
    const mockCanvas = {
      getContext: vi.fn((contextId: string) => {
        if (contextId === "webgl") {
          return {} as WebGLRenderingContext;
        }
        return null;
      }),
    } as unknown as HTMLCanvasElement;

    expect(isWebGLAvailable(mockCanvas)).toBe(false);
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

  // G6: 判定のために確保したコンテキストは手放す。ブラウザが同時に持てる
  // WebGL コンテキストの数には上限があり、上限の小さい環境では判定が
  // 本番のレンダラの取り分を奪って、実際には使えるのに案内画面へ落ちる。
  it("G6: releases the probe context via WEBGL_lose_context when available", () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn((name: string) =>
      name === "WEBGL_lose_context" ? { loseContext } : null
    );
    const mockCanvas = {
      getContext: vi.fn((contextId: string) =>
        contextId === "webgl2" ? ({ getExtension } as unknown as WebGL2RenderingContext) : null
      ),
    } as unknown as HTMLCanvasElement;

    expect(isWebGLAvailable(mockCanvas)).toBe(true);
    expect(getExtension).toHaveBeenCalledWith("WEBGL_lose_context");
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it("G7: still reports true when the probe context cannot be released", () => {
    // 解放手段が無い環境でも判定結果は変えない（解放は後始末であって判定条件ではない）
    const mockCanvas = {
      getContext: vi.fn((contextId: string) =>
        contextId === "webgl2"
          ? ({
              getExtension: () => {
                throw new Error("extension lookup failed");
              },
            } as unknown as WebGL2RenderingContext)
          : null
      ),
    } as unknown as HTMLCanvasElement;

    expect(isWebGLAvailable(mockCanvas)).toBe(true);
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
