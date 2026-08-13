# Web Swing Toy

**Play it: https://rengotaku.github.io/web-swing-toy/**

Hold the mouse to fire a wire at a building, swing off it, let go and fly.
There is no score and no goal — the movement itself is the whole thing.

Aim with the cursor. The reticle brackets snap shut when something in range is
grabbable. Hold to reel in and build speed, release at the bottom of the arc to
keep it. Land and stop moving and you are lifted back into the sky, because a
toy you can get stuck in is a toy you stop touching.

Needs WebGL2. If your browser has hardware acceleration turned off, the page
tells you so instead of showing a blank screen.

## What it is

A browser toy built on Three.js. You are a point mass over a procedurally
generated city. Press and hold to attach a wire to whatever the cursor is
pointing at; the rope constraint turns your fall into a pendulum, and the
pendulum turns height into speed. Release at the bottom of the arc and you
keep the momentum. Miss the next anchor and you meet the ground.

The three things that carry the feel:

- **the pendulum** — a real distance constraint, not a scripted curve
- **inertia** — releasing preserves velocity, so timing the release is the skill
- **the fall** — the camera lags and the field of view widens as you drop

## Development

Everything goes through the Makefile.

```bash
make install   # install dependencies
make play      # open the toy in an isolated Chrome profile
make run       # Vite dev server on :5173
make ci        # lint + format check + tests with coverage + build
make help      # all targets
```

`make play` opens Chrome with its own `--user-data-dir`, so it never touches the
settings, tabs or extensions of the browser you use for everything else. That
matters if you keep hardware acceleration off in your day-to-day browser: this
toy needs WebGL2, and the separate profile has it on without you changing
anything.

## Deployment

`main` deploys to GitHub Pages through `.github/workflows/deploy.yml`. The
workflow lints, tests and builds before publishing, so a red build never reaches
the live URL.

Pages serves from a repository subpath, so the build takes `BASE_PATH`. Building
without it produces absolute asset paths that 404 in production while working
perfectly on localhost.

## Layout

| Path          | What lives there                                                    |
| ------------- | ------------------------------------------------------------------- |
| `src/engine/` | Pure TypeScript simulation — physics, world generation, camera rig   |
| `src/render/` | Three.js scene: meshes, materials, the frame loop                    |
| `src/ui/`     | React HUD drawn over the canvas                                      |

`src/engine/` has no Three.js import and no DOM access, which is what makes the
physics unit-testable. The coverage gate applies to that layer; the render layer
and the HUD are verified with screenshots instead.
