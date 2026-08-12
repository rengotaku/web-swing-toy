import { useRef } from "react";
import { isWebGLAvailable } from "./lib/webgl";
import { useGame } from "./ui/useGame";
import { WebGLUnavailable } from "./ui/WebGLUnavailable";

/**
 * Application shell.
 *
 * The game owns a full-bleed canvas; React owns only the HUD layer stacked on
 * top of it.
 *
 * Everything in the HUD layer must stay pointer-transparent. You aim by
 * pressing anywhere on the screen, so any element that swallows a pointerdown
 * becomes a patch of screen where the toy silently does nothing.
 */
function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  const available = isWebGLAvailable();

  useGame(available ? stageRef : { current: null }, available ? hudRef : undefined);

  if (!available) {
    return <WebGLUnavailable />;
  }

  return (
    <main className="relative h-full w-full overflow-hidden">
      <div id="stage" ref={stageRef} className="absolute inset-0" />
      <div
        ref={hudRef}
        className="tabular pointer-events-none absolute top-4 left-4 rounded bg-black/40 px-3 py-1.5 text-sm font-mono text-[var(--hud)] backdrop-blur-sm"
      >
        SPD: 0.0 m/s | ALT: 0.0 m
      </div>
    </main>
  );
}

export default App;
