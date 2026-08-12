import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import * as webglModule from "./lib/webgl";
import * as gameModule from "./render/game";

describe("App (G5 Integration Test)", () => {
  it("G5: switches to WebGLUnavailable when createGame fails despite isWebGLAvailable returning true", async () => {
    vi.spyOn(webglModule, "isWebGLAvailable").mockReturnValue(true);
    vi.spyOn(gameModule, "createGame").mockImplementation(() => null);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "WebGL を使用できません" })
      ).toBeDefined();
    });
  });

  it("G5 variant: switches to WebGLUnavailable when createGame throws despite isWebGLAvailable returning true", async () => {
    vi.spyOn(webglModule, "isWebGLAvailable").mockReturnValue(true);
    vi.spyOn(gameModule, "createGame").mockImplementation(() => {
      throw new Error("WebGLRenderer creation failed");
    });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "WebGL を使用できません" })
      ).toBeDefined();
    });
  });
});
