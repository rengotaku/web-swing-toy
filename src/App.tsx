import { useRef } from "react";
import { useGame } from "./ui/useGame";

/**
 * Application shell.
 *
 * The game owns a full-bleed canvas; React owns only the HUD layer stacked on
 * top of it.
 */
function App() {
  const stageRef = useRef<HTMLDivElement>(null);

  useGame(stageRef);

  return (
    <main className="relative h-full w-full overflow-hidden">
      <div id="stage" ref={stageRef} className="absolute inset-0" />
      <p className="tabular absolute bottom-6 left-1/2 -translate-x-1/2 text-sm opacity-60">
        STEP1: Stage & Physics Loop Active
      </p>
    </main>
  );
}

export default App;
