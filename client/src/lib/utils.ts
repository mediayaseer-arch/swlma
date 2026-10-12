import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { doc, setDoc } from "./firebase";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const onlyNumbers = (value: string) => value.replace(/[^\d٠-٩]/g, "");

const PRESENCE_HEARTBEAT_MS = 25_000;
type PresenceHandle = { cleanup: () => void };
const activePresence = new Map<string, PresenceHandle>();

export const setupOnlineStatus = (userId: string) => {
  if (!userId) return () => {};
  const existing = activePresence.get(userId);
  if (existing) return existing.cleanup;
  const ref = doc(null, "pays", userId);
  const writeOnline = async (online: boolean, keepalive = false) => {
    try { await setDoc(ref, { online, lastSeen: new Date().toISOString() }, { merge: true, keepalive }); } catch { /* transient network error */ }
  };
  void writeOnline(true);
  const heartbeat = window.setInterval(() => void writeOnline(true), PRESENCE_HEARTBEAT_MS);
  const goOffline = () => { void writeOnline(false, true); };
  window.addEventListener("beforeunload", goOffline);
  window.addEventListener("pagehide", goOffline);
  const cleanup = () => {
    window.clearInterval(heartbeat);
    window.removeEventListener("beforeunload", goOffline);
    window.removeEventListener("pagehide", goOffline);
    void writeOnline(false);
    activePresence.delete(userId);
  };
  activePresence.set(userId, { cleanup });
  return cleanup;
};

export const setUserOffline = async (userId: string) => {
  if (userId) await setDoc(doc(null, "pays", userId), { online: false, lastSeen: new Date().toISOString() }, { merge: true });
};
