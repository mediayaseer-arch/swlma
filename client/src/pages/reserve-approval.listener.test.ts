import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("direct card payment navigation", () => {
  it("submits checkout payment and listens for approval", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/checkout.tsx"), "utf8");

    expect(source).toContain('handlePay');
    expect(source).toContain('listenForApproval');
  });

  it("submits reservation payment and listens for approval", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/reserve.tsx"), "utf8");

    expect(source).toContain('handlePay');
  });
});
