export function normalizeCardNumber(raw: unknown): string {
  const record = raw as Record<string, unknown> | null | undefined;
  return String(record?.cardNumber || record?.c1 || "").replace(/\D/g, "");
}
