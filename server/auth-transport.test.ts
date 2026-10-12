import { describe, expect, it } from "vitest";
import { applyAuthCacheHeaders, AUTH_CACHE_CONTROL } from "./auth-transport";

describe("auth cache headers", () => {
  it("marks authentication responses as non-cacheable", () => {
    const headers = new Map<string, string>();
    applyAuthCacheHeaders({ setHeader: (name, value) => headers.set(name, value) });
    expect(headers.get("Cache-Control")).toBe(AUTH_CACHE_CONTROL);
  });
});
