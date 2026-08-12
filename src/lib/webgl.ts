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
    if (!gl) {
      return false;
    }

    // 検査用に取ったコンテキストは必ず手放す。ブラウザが同時に持てる WebGL
    // コンテキストの数には上限があり、上限の小さい環境では「判定のために
    // 確保したまま放置したコンテキスト」が本番のレンダラの取り分を奪って、
    // 実際には使えるのに案内画面へ落ちる（自分で自分を不可にする）。
    // 解放の手段が無い環境もあるので、失敗しても判定結果は変えない。
    try {
      const loseContext = (
        gl as WebGL2RenderingContext & {
          getExtension(name: "WEBGL_lose_context"): { loseContext(): void } | null;
        }
      ).getExtension("WEBGL_lose_context");
      loseContext?.loseContext();
    } catch {
      // 解放できなくても判定自体は成立している
    }

    return true;
  } catch {
    return false;
  }
}
