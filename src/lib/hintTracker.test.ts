import { describe, it, expect, beforeEach } from "vitest";
import { createHintTracker } from "./hintTracker";
import type { StorageAdapter } from "./hintTracker";

class MockStorage implements StorageAdapter {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  clear() {
    this.store.clear();
  }
}

describe("T3, T4, T5: HintTracker", () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it("T3: ヒント表示状態で attach のみ発生しても非表示にならない (解除まで完了していない)", () => {
    const tracker = createHintTracker(mockStorage, "test-key");
    expect(tracker.isHintVisible()).toBe(true);

    // attach のみ呼び出し
    tracker.onAttach();

    // attach だけでは成立しないため表示されたまま
    expect(tracker.isHintVisible()).toBe(true);
  });

  it("T4: attach -> detach が 1 度通るとヒントが非表示になり永続化される", () => {
    const tracker = createHintTracker(mockStorage, "test-key");
    expect(tracker.isHintVisible()).toBe(true);

    tracker.onAttach();
    expect(tracker.isHintVisible()).toBe(true);

    tracker.onDetach();
    // 成立条件を満たして非表示になる
    expect(tracker.isHintVisible()).toBe(false);
    expect(mockStorage.getItem("test-key")).toBe("true");
  });

  it("T5: 永続化済みの状態で再初期化された場合、最初から非表示になる", () => {
    mockStorage.setItem("test-key", "true");

    const tracker = createHintTracker(mockStorage, "test-key");
    // 再訪問時は最初から非表示
    expect(tracker.isHintVisible()).toBe(false);
  });
});
