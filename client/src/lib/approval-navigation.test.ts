import { describe, expect, it, vi } from "vitest";
import { approvalDestination, handleCheckoutApproval } from "./approval-navigation";

describe("approvalDestination", () => {
  it("routes an approved card to OTP", () => {
    expect(approvalDestination("approved")).toBe("/otp");
  });

  it("does not route a rejected card to OTP", () => {
    expect(approvalDestination("rejected")).toBeNull();
  });
});

describe("handleCheckoutApproval", () => {
  it("navigates to /otp for an approved snapshot on checkout mount", () => {
    const navigate = vi.fn();

    expect(handleCheckoutApproval("approved", navigate)).toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/otp");
  });

  it("does not navigate for a rejected snapshot", () => {
    const navigate = vi.fn();

    expect(handleCheckoutApproval("rejected", navigate)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
