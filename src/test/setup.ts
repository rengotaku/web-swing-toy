import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom on Node 22+ ships an incomplete localStorage and a StorageEvent whose
// constructor rejects partial init dicts. Both are replaced here so persistence
// hooks can be tested the way they actually run in a browser.
if (typeof window !== "undefined") {
  const store = new Map<string, string>();

  const storageMock: Storage = {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, String(value));
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
    clear: (): void => {
      store.clear();
    },
    key: (index: number): string | null => Array.from(store.keys())[index] ?? null,
    get length(): number {
      return store.size;
    },
  };

  vi.stubGlobal("localStorage", storageMock);
  window.localStorage = storageMock;

  class FlexibleStorageEvent extends Event implements StorageEvent {
    readonly key: string | null;
    readonly oldValue: string | null;
    readonly newValue: string | null;
    readonly url: string;
    readonly storageArea: Storage | null;

    constructor(type: string, eventInitDict?: StorageEventInit) {
      super(type, eventInitDict);
      this.key = eventInitDict?.key ?? null;
      this.oldValue = eventInitDict?.oldValue ?? null;
      this.newValue = eventInitDict?.newValue ?? null;
      this.url = eventInitDict?.url ?? "";
      this.storageArea = eventInitDict?.storageArea ?? null;
    }

    initStorageEvent(): void {
      // no-op legacy initializer
    }
  }

  vi.stubGlobal("StorageEvent", FlexibleStorageEvent);
  window.StorageEvent = FlexibleStorageEvent as unknown as typeof StorageEvent;
}
