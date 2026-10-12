export type ApprovalWaitDecision =
  | { kind: "pending"; remainingMs: number }
  | { kind: "approved"; remainingMs: number }
  | { kind: "rejected" }
  | null;

export function getApprovalWaitDecision(
  status: "approved" | "rejected",
  startedAt: number,
  now = Date.now(),
  minimumWaitMs = 7000,
): ApprovalWaitDecision {
  if (status === "rejected") return { kind: "rejected" };
  const remainingMs = Math.max(0, minimumWaitMs - (now - startedAt));
  return { kind: "approved", remainingMs };
}
