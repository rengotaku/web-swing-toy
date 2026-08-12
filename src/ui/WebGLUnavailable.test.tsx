import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WebGLUnavailable } from "./WebGLUnavailable";

describe("WebGLUnavailable", () => {
  it("renders notice clearly without apologies or exclamation marks", () => {
    const { container } = render(<WebGLUnavailable />);
    const text = container.textContent || "";

    // 謝罪文が含まれていないこと
    expect(text).not.toMatch(/申し訳/);
    expect(text).not.toMatch(/ごめんなさい/);
    expect(text).not.toMatch(/すみません/);

    // 感嘆符が含まれていないこと
    expect(text).not.toContain("!");
    expect(text).not.toContain("！");

    // 必要事項3点
    expect(screen.getByRole("heading", { name: "WebGL を使用できません" })).toBeDefined();
    expect(text).toContain("WebGL を使用します");
    expect(text).toContain("chrome://settings/system");
  });
});
