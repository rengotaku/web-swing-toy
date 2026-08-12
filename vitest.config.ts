import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html"],
      // The coverage gate applies to branching logic only: the pure simulation
      // (src/engine) and shared helpers (src/hooks). The Three.js render layer
      // (src/render) has no meaningful jsdom coverage — there is no WebGL
      // context — and the HUD is a visual surface. Both are verified with
      // screenshots instead, so including them here would only invite
      // tautological tests that pass while the screen is broken.
      include: ["src/engine/**/*.ts", "src/hooks/**/*.ts", "src/lib/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
    },
  },
});
