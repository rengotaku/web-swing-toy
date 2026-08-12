export type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const STORAGE_KEY = "web-swing-toy:has-swung";

export interface HintTracker {
  isHintVisible: () => boolean;
  onAttach: () => void;
  onDetach: () => void;
  subscribe: (listener: () => void) => () => void;
}

/**
 * 初回のみヒントを表示し、attachRope → detachRope が 1 度通過したら非表示・永続化するトラッカー。
 */
export function createHintTracker(
  storage?: StorageAdapter | null,
  key: string = STORAGE_KEY
): HintTracker {
  const getStorage = (): StorageAdapter | null => {
    if (storage !== undefined) return storage;
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    return null;
  };

  const store = getStorage();
  const listeners = new Set<() => void>();

  let hasSwung = false;
  if (store) {
    try {
      const item = store.getItem(key);
      if (item !== null) {
        hasSwung = JSON.parse(item) === true;
      }
    } catch {
      hasSwung = false;
    }
  }

  let isAttached = false;

  const notify = () => {
    listeners.forEach((fn) => fn());
  };

  const isHintVisible = () => !hasSwung;

  const onAttach = () => {
    if (hasSwung) return;
    isAttached = true;
  };

  const onDetach = () => {
    if (hasSwung) return;
    if (isAttached) {
      isAttached = false;
      hasSwung = true;
      if (store) {
        try {
          store.setItem(key, JSON.stringify(true));
        } catch {
          // ignore
        }
      }
      notify();
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    isHintVisible,
    onAttach,
    onDetach,
    subscribe,
  };
}
