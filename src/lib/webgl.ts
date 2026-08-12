/**
 * WebGL コンテキストが利用可能かを判定する純関数。
 * Three.js の WebGLRenderer は WebGL2 を要求するため、webgl2 コンテキストの取得可否のみを検証する。
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

    const gl = targetCanvas.getContext("webgl2");
    return Boolean(gl);
  } catch {
    return false;
  }
}
