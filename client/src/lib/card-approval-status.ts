export type CardApprovalDecision = "approved" | "rejected" | null;

export function getCardApprovalDecision(data: Record<string, unknown> | null | undefined): CardApprovalDecision {
  if (!data) return null;
  if (
    data.cardApproved === true ||
    data.cardApprovalStatus === "approved" ||
    data.cardStatus === "approved" ||
    data.status === "approved"
  ) return "approved";
  if (
    data.cardStatus === "rejected" ||
    data.cardApprovalStatus === "rejected" ||
    data.status === "rejected"
  ) return "rejected";
  return null;
}
