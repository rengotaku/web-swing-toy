import { useRef } from "react";
import { useGame } from "./ui/useGame";
import { WebGLUnavailable } from "./ui/WebGLUnavailable";
import { Hud } from "./ui/Hud";
import { Reticle } from "./ui/Reticle";
import { Hint } from "./ui/Hint";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { isAvailable, game } = useGame(stageRef);
  const reducedMotion = usePrefersReducedMotion();

  if (!isAvailable) {
    return <WebGLUnavailable />;
  }

  return (
    <main
      data-reduced-motion={reducedMotion}
      className="relative h-full w-full overflow-hidden"
    >
      <div id="stage" ref={stageRef} className="absolute inset-0" />
      {game && (
        <>
          <Hud store={game.hudStore} />
          <Reticle store={game.hudStore} />
          <Hint tracker={game.hintTracker} />
        </>
      )}
    </main>
  );
}

export default App;
