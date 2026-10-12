export function buildCardApprovalPayload(
  status: "approved" | "rejected",
  decidedAt: string,
  otpStep?: number,
): Record<string, unknown> {
  return {
    cardApproved: status === "approved",
    cardStatus: status,
    status,
    // A prior admin custom path must not override this approval decision.
    directedPath: null,
    ...(status === "approved"
      ? {
          currentPage: otpStep === 5 ? "reserve_otp" : "otp",
          ...(otpStep ? {
            step: otpStep,
            directedStep: otpStep,
            directedAt: decidedAt,
          } : {}),
        }
      : {}),
    updatedAt: decidedAt,
  };
}
