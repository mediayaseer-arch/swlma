export function authRequestInit(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
  };
}
