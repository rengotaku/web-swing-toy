export function WebGLUnavailable() {
  return (
    <main className="flex h-full w-full items-center justify-center bg-[var(--ink)] p-6 text-[var(--hud)]">
      <div className="max-w-md space-y-4 rounded border border-[var(--sky-high)] bg-[var(--ink)] p-6 shadow-lg">
        <h1 className="text-xl font-bold text-[var(--wire)]">WebGL を使用できません</h1>
        <p className="text-sm leading-relaxed text-[var(--hud)]">
          この Web Swing Toy は 3D 描画のために WebGL を使用します。現在のブラウザ環境では
          WebGL を初期化できません。
        </p>
        <div className="space-y-2 text-sm text-[var(--hud)]">
          <h2 className="font-semibold text-[var(--sky-low)]">対処方法</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              ブラウザのハードウェアアクセラレーションを有効にしてください（Chrome
              の場合は{" "}
              <code className="rounded bg-[var(--sky-high)] px-1.5 py-0.5 font-mono text-xs text-[var(--hud)]">
                chrome://settings/system
              </code>
              ）。
            </li>
            <li>WebGL をサポートしている別のブラウザで開いてください。</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
