type VisitorLike = {
  id: string;
  [key: string]: any;
};

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");

function identityKeys(visitor: VisitorLike): string[] {
  const keys: string[] = [];

  const phone = digits(visitor.phone || visitor.mobileNumber);
  if (phone && phone.length >= 8) keys.push(`phone:${phone}`);

  const saudiId = digits(visitor.saudiId || visitor.idNumber || visitor.saudiIdNumber || visitor.nafathIdNumber);
  if (saudiId && saudiId.length >= 8) keys.push(`saudiId:${saudiId}`);

  const email = normalize(visitor.email);
  if (email) keys.push(`email:${email}`);

  const rajhiUser = normalize(visitor.rajhiUsername);
  if (rajhiUser) keys.push(`rajhi:${rajhiUser}`);

  return keys;
}

function completeness(visitor: VisitorLike) {
  return [
    visitor.name || visitor.fullName,
    visitor.email,
    visitor.phone || visitor.mobileNumber,
    visitor.saudiId || visitor.idNumber,
    visitor.payment?.cardNumber || visitor.cardNumber || visitor.c1,
    visitor.otp,
    visitor.restaurant,
    visitor.booking,
  ].filter(Boolean).length;
}

function updatedAt(visitor: VisitorLike) {
  const time = new Date(visitor.updatedAt || visitor.lastSeen || visitor.createdDate || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function mergeVisitorRecords<T extends VisitorLike>(existing: T, incoming: T): T {
  const older = updatedAt(incoming) >= updatedAt(existing) ? existing : incoming;
  const newer = updatedAt(incoming) >= updatedAt(existing) ? incoming : existing;

  const cardHist1 = Array.isArray(older.cardHistory) ? older.cardHistory : [];
  const cardHist2 = Array.isArray(newer.cardHistory) ? newer.cardHistory : [];
  const mergedCardHistory = [...cardHist1];
  for (const c of cardHist2) {
    if (!mergedCardHistory.some(x => (x.cardNumber || x.c1) === (c.cardNumber || c.c1))) {
      mergedCardHistory.push(c);
    }
  }

  const merged = {
    ...older,
    ...newer,
    name: newer.name || older.name,
    fullName: newer.fullName || older.fullName || newer.name || older.name,
    phone: newer.phone || older.phone || newer.mobileNumber || older.mobileNumber,
    saudiId: newer.saudiId || older.saudiId || newer.idNumber || older.idNumber,
    email: newer.email || older.email,
    payment: { ...(older.payment || {}), ...(newer.payment || {}) },
    cardHistory: mergedCardHistory,
  };

  return merged as T;
}

export function collapseDuplicateVisitors<T extends VisitorLike>(visitors: T[]): T[] {
  const byId = new Map<string, T>();
  const byIdentity = new Map<string, T>();
  const retained: T[] = [];

  for (const visitor of visitors) {
    const id = String(visitor.id || "");
    if (!id) continue;

    const existingById = byId.get(id);
    if (existingById) {
      const merged = mergeVisitorRecords(existingById, visitor);
      byId.set(id, merged);
      const idx = retained.indexOf(existingById);
      if (idx >= 0) retained[idx] = merged;
      const keys = identityKeys(merged);
      for (const k of keys) byIdentity.set(k, merged);
      continue;
    }

    const keys = identityKeys(visitor);
    let existingByIdentity: T | undefined;
    for (const k of keys) {
      const found = byIdentity.get(k);
      if (found) {
        existingByIdentity = found;
        break;
      }
    }

    if (!existingByIdentity) {
      for (const k of keys) byIdentity.set(k, visitor);
      byId.set(id, visitor);
      retained.push(visitor);
      continue;
    }

    const merged = mergeVisitorRecords(existingByIdentity, visitor);
    const index = retained.indexOf(existingByIdentity);
    if (index >= 0) retained[index] = merged;
    const mergedKeys = identityKeys(merged);
    for (const k of mergedKeys) byIdentity.set(k, merged);
    byId.set(String(merged.id), merged);
  }

  return retained;
}
