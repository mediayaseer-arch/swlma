export type ApprovalStatus = "approved" | "rejected";

export function approvalDestination(status: ApprovalStatus): "/otp" | null {
  return status === "approved" ? "/otp" : null;
}

export function handleCheckoutApproval(
  status: ApprovalStatus,
  navigate: (destination: "/otp") => void,
): boolean {
  const destination = approvalDestination(status);
  if (!destination) return false;
  navigate(destination);
  return true;
}
