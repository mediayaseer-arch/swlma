import { describe, expect, it, vi, afterEach } from "vitest";
import { isBinBlocked } from "../client/src/lib/firebase";
import { isPresenceOnline, PRESENCE_STALE_MS, presenceOfflineRequestInit } from "../client/src/lib/presence";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("presence and payment behavior", () => {
  it("does not reject a BIN when the blocked_bins row is missing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: null }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })));

    await expect(isBinBlocked("4111111111111111")).resolves.toBe(false);
  });

  it("rejects a BIN only when a blocked_bins row exists", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { id: "555555" } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })));

    await expect(isBinBlocked("5555554444444444")).resolves.toBe(true);
  });

  it("expires online status after the heartbeat window", () => {
    const now = Date.parse("2026-08-20T00:00:00.000Z");
    expect(isPresenceOnline({ online: true, lastSeen: new Date(now - PRESENCE_STALE_MS + 1_000).toISOString() }, now)).toBe(true);
    expect(isPresenceOnline({ online: true, lastSeen: new Date(now - PRESENCE_STALE_MS - 1_000).toISOString() }, now)).toBe(false);
    expect(isPresenceOnline({ online: false, lastSeen: new Date(now).toISOString() }, now)).toBe(false);
  });

  it("marks page-teardown writes as same-origin keepalive requests", () => {
    const init = presenceOfflineRequestInit("2026-08-20T00:00:00.000Z");
    expect(init.keepalive).toBe(true);
    expect(init.credentials).toBe("same-origin");
    expect(JSON.parse(String(init.body))).toMatchObject({ payload: { online: false }, merge: true });
  });
});
