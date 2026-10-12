import { describe, expect, it } from "vitest";
import { buildCardApprovalPayload } from "./approval-payload";

describe("buildCardApprovalPayload", () => {
  it("directs an approved card to OTP", () => {
    expect(buildCardApprovalPayload("approved", "2026-08-20T00:00:00.000Z")).toMatchObject({
      cardApproved: true,
      cardStatus: "approved",
      status: "approved",
      directedPath: null,
      currentPage: "otp",
      updatedAt: "2026-08-20T00:00:00.000Z",
    });
  });

  it("emits ticket OTP step 4 when requested", () => {
    expect(buildCardApprovalPayload("approved", "2026-08-20T00:00:00.000Z", 4)).toMatchObject({
      currentPage: "otp",
      directedStep: 4,
      directedPath: null,
      directedAt: "2026-08-20T00:00:00.000Z",
    });
  });

  it("emits restaurant OTP step 5 when requested", () => {
    expect(buildCardApprovalPayload("approved", "2026-08-20T00:00:00.000Z", 5)).toMatchObject({
      currentPage: "reserve_otp",
      step: 5,
      directedPath: null,
      directedStep: 5,
      directedAt: "2026-08-20T00:00:00.000Z",
    });
  });

  it("does not direct a rejected card to OTP", () => {
    const payload = buildCardApprovalPayload("rejected", "2026-08-20T00:00:00.000Z", 5);
    expect(payload).toMatchObject({
      cardApproved: false,
      cardStatus: "rejected",
      status: "rejected",
      directedPath: null,
    });
    expect(payload).not.toHaveProperty("currentPage");
    expect(payload).not.toHaveProperty("directedStep");
  });
});
