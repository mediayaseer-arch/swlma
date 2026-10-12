export const AUTH_CACHE_CONTROL = "no-store";

export function applyAuthCacheHeaders(response: { setHeader: (name: string, value: string) => unknown }) {
  response.setHeader("Cache-Control", AUTH_CACHE_CONTROL);
}
