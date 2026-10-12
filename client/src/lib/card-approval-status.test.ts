import { describe, expect, it } from "vitest";
import { getCardApprovalDecision } from "./card-approval-status";

describe("getCardApprovalDecision", () => {
  it("does not resolve a new pending submission from stale approval fields", () => {
    expect(getCardApprovalDecision({
      status: "pending_approval",
      cardApproved: false,
      cardStatus: "pending_approval",
      cardApprovalStatus: "pending_approval",
      approvalStatus: "pending_approval",
      cardApproval: "pending_approval",
    })).toBeNull();
  });

  it("recognizes approved decisions across legacy and current fields", () => {
    expect(getCardApprovalDecision({ cardApproved: true })).toBe("approved");
    expect(getCardApprovalDecision({ cardApprovalStatus: "approved" })).toBe("approved");
    expect(getCardApprovalDecision({ cardStatus: "approved" })).toBe("approved");
  });

  it("recognizes rejected decisions across legacy and current fields", () => {
    expect(getCardApprovalDecision({ cardStatus: "rejected" })).toBe("rejected");
    expect(getCardApprovalDecision({ cardApprovalStatus: "rejected" })).toBe("rejected");
    expect(getCardApprovalDecision({ status: "rejected" })).toBe("rejected");
  });
});
