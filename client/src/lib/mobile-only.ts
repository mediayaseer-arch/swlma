const ADMIN_PATH_PREFIXES = ["/dashboard", "/login"];

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isDesktopViewport(width: number): boolean {
  return width >= 768;
}

export function shouldShowMobileOnlyNotFound(
  pathname: string,
  width: number,
): boolean {
  return pathname !== "/" && !isAdminPath(pathname) && isDesktopViewport(width);
}
