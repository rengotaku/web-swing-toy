# Web Swing Toy

Hold the mouse to fire a wire at a building, swing off it, let go and fly.
There is no score and no goal — the movement itself is the whole thing.

> Status: scaffolding. The engine is not wired up yet.

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
make run       # Vite dev server on :5173
make ci        # lint + format check + tests with coverage + build
make help      # all targets
```

## Layout

| Path          | What lives there                                                    |
| ------------- | ------------------------------------------------------------------- |
| `src/engine/` | Pure TypeScript simulation — physics, world generation, camera rig   |
| `src/render/` | Three.js scene: meshes, materials, the frame loop                    |
| `src/ui/`     | React HUD drawn over the canvas                                      |

`src/engine/` has no Three.js import and no DOM access, which is what makes the
physics unit-testable. The coverage gate applies to that layer; the render layer
and the HUD are verified with screenshots instead.
