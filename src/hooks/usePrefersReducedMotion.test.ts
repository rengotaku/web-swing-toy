import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

describe("usePrefersReducedMotion", () => {
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];
  let matchesValue = false;

  beforeEach(() => {
    listeners = [];
    matchesValue = false;

    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: matchesValue,
      media: query,
      onchange: null,
      addListener: (fn: (e: MediaQueryListEvent) => void) => listeners.push(fn),
      removeListener: (fn: (e: MediaQueryListEvent) => void) => {
        listeners = listeners.filter((l) => l !== fn);
      },
      addEventListener: (type: string, fn: (e: MediaQueryListEvent) => void) => {
        if (type === "change") listeners.push(fn);
      },
      removeEventListener: (type: string, fn: (e: MediaQueryListEvent) => void) => {
        if (type === "change") listeners = listeners.filter((l) => l !== fn);
      },
      dispatchEvent: () => true,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("デフォルト状態 (matches: false) の値を返す", () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("メディアクエリの変更イベントに追従して更新される", () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    matchesValue = true;
    act(() => {
      listeners.forEach((listener) =>
        listener({
          matches: true,
          media: "(prefers-reduced-motion: reduce)",
        } as MediaQueryListEvent)
      );
    });

    expect(result.current).toBe(true);
  });
});
