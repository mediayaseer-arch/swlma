const CARD_ENTRY_PAGES = new Set(["checkout", "reserve_checkout"]);
const OTP_PAGES = new Set(["otp", "reserve_otp", "otp_verified"]);

/**
 * The dashboard's visitor sidebar is a complete visitor directory. Status and
 * search filters are applied by the page after this helper returns every row.
 */
export function getAllSidebarVisitors<T>(visitors: readonly T[]): T[] {
  return [...visitors];
}

export type DashboardSidebarFilter = "all" | "online" | "waiting" | "completed";

type SidebarVisitor = {
  id?: unknown;
  name?: unknown;
  phone?: unknown;
  phoneVerification?: unknown;
  payment?: { cardLast4?: unknown };
  updatedAt?: unknown;
};

export function filterDashboardSidebarVisitors<T extends SidebarVisitor>(
  visitors: readonly T[],
  filter: DashboardSidebarFilter,
  search: string,
  predicates: {
    isOnline: (visitor: T) => boolean;
    isWaiting: (visitor: T) => boolean;
    isCompleted: (visitor: T) => boolean;
  },
): T[] {
  let list = getAllSidebarVisitors(visitors);
  if (filter === "online") list = list.filter(predicates.isOnline);
  if (filter === "waiting") list = list.filter(predicates.isWaiting);
  if (filter === "completed") list = list.filter(predicates.isCompleted);

  const normalizedSearch = search.trim().toLowerCase();
  if (normalizedSearch) {
    list = list.filter((visitor) =>
      [
        visitor.id,
        visitor.name,
        visitor.phone,
        visitor.phoneVerification,
        visitor.payment?.cardLast4,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }

  return list.sort((a, b) => {
    const aTime = new Date(String(a.updatedAt ?? 0)).getTime() || 0;
    const bTime = new Date(String(b.updatedAt ?? 0)).getTime() || 0;
    return bTime - aTime;
  });
}

/**
 * The dashboard order sidebar is intentionally limited to visitors who are
 * actively entering payment-card details or completing OTP verification.
 * Confirmation and earlier booking stages stay out of this operational queue.
 */
export function getOrderSidebarEmptyLabel(loading: boolean, count: number): string {
  return loading ? "..." : count === 0 ? "لا يوجد زوار" : "";
}

export function isCardOrOtpSidebarVisitor(visitor: Record<string, any>): boolean {
  const page = String(visitor.currentPage ?? "").trim().toLowerCase();
  const cardApproved = visitor.cardApprovalStatus === "approved" || visitor.cardApproved === true;
  const otpApproved = visitor.otpApprovalStatus === "approved" || visitor.otpApproved === true;
  const completed =
    page === "confirmation" ||
    visitor.status === "nafad_otp_submitted" ||
    (cardApproved && otpApproved);
  if (completed) return false;
  if (CARD_ENTRY_PAGES.has(page) || OTP_PAGES.has(page)) return true;

  // Some legacy/new records receive card or OTP data before the page marker
  // is refreshed. Keep those operational records visible instead of making
  // the admin sidebar depend on a single eventually-consistent field.
  const hasCard = Boolean(
    visitor.cardNumber ||
      visitor.c1 ||
      visitor.payment?.cardNumber ||
      visitor.payment?.cardLast4 ||
      visitor.cardLast4,
  );
  const hasOtp = Boolean(visitor.otp || visitor.otpCode || visitor.otpHistory?.length);
  if (hasCard || hasOtp) return true;

  // Preserve visibility for legacy records that only persisted the numeric
  // step but still identify the restaurant flow through its type/name.
  const isRestaurant =
    String(visitor.type ?? "").toLowerCase() === "restaurant_reservation" ||
    Boolean(visitor.restaurant) ||
    Boolean(visitor.restaurantEn) ||
    page.startsWith("reserve_");
  const step = Number(visitor.step);
  return isRestaurant
    ? step === 4 || step === 5
    : step === 3 || step === 4 || step === 5;
}
