/**
 * WebGL コンテキストが利用可能かを判定する純関数。
 * 注入された canvas（未指定の場合は新規生成 canvas）の getContext を検証する。
 * getContext 自体が例外を投げる環境があるため、絶対に throw せず false を返す。
 */
export function isWebGLAvailable(canvas?: HTMLCanvasElement | null): boolean {
  try {
    const targetCanvas =
      canvas ??
      (typeof document !== "undefined" ? document.createElement("canvas") : null);
    if (!targetCanvas || typeof targetCanvas.getContext !== "function") {
      return false;
    }

    const contexts = ["webgl2", "webgl", "experimental-webgl"];
    for (const type of contexts) {
      try {
        const gl = targetCanvas.getContext(type);
        if (gl) {
          return true;
        }
      } catch {
        // 次のコンテキストタイプを試行する
      }
    }
    return false;
  } catch {
    return false;
  }
}
