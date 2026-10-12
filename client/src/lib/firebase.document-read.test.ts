import { afterEach, describe, expect, it, vi } from "vitest";
import { doc, getDoc, onSnapshot } from "./firebase";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockDocument(data: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data }),
  }));
}

describe("document response envelopes", () => {
  it("reads a document after unwrapping the API envelope once", async () => {
    mockDocument({ title: "Existing setting", data: { nested: true } });
    const snapshot = await getDoc(doc(null, "settings", "example"));
    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()).toEqual({
      id: "example",
      title: "Existing setting",
      data: { nested: true },
    });
  });

  it("reports a missing document", async () => {
    mockDocument(null);
    const snapshot = await getDoc(doc(null, "settings", "missing"));
    expect(snapshot.exists()).toBe(false);
    expect(snapshot.data()).toBeUndefined();
  });

  it("passes the unwrapped document to subscription callbacks", async () => {
    mockDocument({ title: "Existing setting" });
    vi.stubGlobal("window", { setTimeout: vi.fn() });
    const callback = vi.fn();
    const unsubscribe = onSnapshot(doc(null, "settings", "example"), callback);
    try {
      await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce());
      const snapshot = callback.mock.calls[0][0];
      expect(snapshot.exists()).toBe(true);
      expect(snapshot.data()).toEqual({
        id: "example",
        title: "Existing setting",
      });
    } finally {
      unsubscribe();
    }
  });
});
