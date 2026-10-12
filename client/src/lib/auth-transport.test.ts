import { describe, expect, it } from "vitest";
import { authRequestInit } from "./auth-transport";

describe("auth transport", () => {
  it("uses same-origin credentials and bypasses cached auth responses", () => {
    expect(authRequestInit({ method: "GET" })).toMatchObject({
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
  });

  it("preserves request headers and body", () => {
    expect(authRequestInit({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      credentials: "same-origin",
      cache: "no-store",
    });
  });
});
