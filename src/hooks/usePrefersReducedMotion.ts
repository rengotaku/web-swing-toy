import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mediaQuery = window.matchMedia(QUERY);
  if ("addEventListener" in mediaQuery) {
    mediaQuery.addEventListener("change", callback);
    return () => {
      mediaQuery.removeEventListener("change", callback);
    };
  } else if ("addListener" in mediaQuery) {
    // 互換性フォールバック
    (mediaQuery as MediaQueryList).addListener(callback);
    return () => {
      (mediaQuery as MediaQueryList).removeListener(callback);
    };
  }
  return () => {};
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * prefers-reduced-motion のメディアクエリ設定を購読し、変更にも追従する React フック。
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
