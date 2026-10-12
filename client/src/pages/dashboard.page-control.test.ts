import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard card page control", () => {
  it("routes the card-level Push to OTP action through the shared payload builder", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/dashboard.tsx"), "utf8");

    expect(source).toContain("onPushStep=");
    expect(source).toContain("buildPageControlPayload(");
    expect(source).toContain("getVisitorFlow(selected)");
  });
});
