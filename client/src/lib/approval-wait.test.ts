import { describe, expect, it } from "vitest";
import { getApprovalWaitDecision } from "./approval-wait";

describe("getApprovalWaitDecision", () => {
  it("keeps an approved payment waiting until seven seconds have elapsed", () => {
    expect(getApprovalWaitDecision("approved", 1_000, 3_500)).toEqual({ kind: "approved", remainingMs: 4_500 });
  });

  it("allows an approved payment to navigate after the minimum wait", () => {
    expect(getApprovalWaitDecision("approved", 1_000, 8_000)).toEqual({ kind: "approved", remainingMs: 0 });
  });

  it("returns a rejection outcome without scheduling OTP navigation", () => {
    expect(getApprovalWaitDecision("rejected", 1_000, 2_000)).toEqual({ kind: "rejected" });
  });

  it("uses the current submission timestamp instead of any earlier decision time", () => {
    expect(getApprovalWaitDecision("approved", 10_000, 10_100)).toEqual({ kind: "approved", remainingMs: 6_900 });
  });
});
