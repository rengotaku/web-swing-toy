/**
 * Application shell.
 *
 * The game owns a full-bleed canvas; React owns only the HUD layer stacked on
 * top of it. Until the engine lands, this renders the empty stage so the shell
 * itself stays verifiable.
 */
function App() {
  return (
    <main className="relative h-full w-full overflow-hidden">
      <div id="stage" className="absolute inset-0" />
      <p className="tabular absolute bottom-6 left-1/2 -translate-x-1/2 text-sm opacity-60">
        engine not wired yet
      </p>
    </main>
  );
}

export default App;
