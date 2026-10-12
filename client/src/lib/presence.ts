export const PRESENCE_STALE_MS = 75_000;

export type PresenceRecord = {
  [key: string]: any;
  online?: boolean | null;
  lastSeen?: string | null;
  updatedAt?: string | null;
};

export function isPresenceOnline(record: PresenceRecord, now = Date.now()): boolean {
  if (record.online === false) return false;
  const activity = record.lastSeen || record.updatedAt;
  if (!activity) return false;
  const timestamp = new Date(activity).getTime();
  if (Number.isNaN(timestamp)) return false;
  return now - timestamp < PRESENCE_STALE_MS;
}

export function presenceOfflinePayload(now = new Date().toISOString()) {
  return { online: false, lastSeen: now };
}

export function presenceOnlinePayload(now = new Date().toISOString()) {
  return { online: true, lastSeen: now };
}

export function presenceOfflineRequestInit(now = new Date().toISOString()): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: presenceOfflinePayload(now), merge: true }),
    credentials: "same-origin",
    keepalive: true,
  };
}
