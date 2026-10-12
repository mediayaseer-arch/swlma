export type PageControlFlow = "ticket" | "restaurant";

const TICKET_STEP_TO_PAGE: Record<number, string> = {
  1: "booking",
  2: "checkout",
  3: "otp",
  4: "verify_mobile",
  5: "phone_otp",
  6: "confirmation",
};

const RESTAURANT_STEP_TO_PAGE: Record<number, string> = {
  1: "reserve_date",
  2: "reserve_details",
  3: "reserve_invoice",
  4: "reserve_checkout",
  5: "reserve_otp",
  6: "confirmation",
};

export function buildPageControlPayload(
  flow: PageControlFlow,
  target: number,
  now: string,
) {
  const pages = flow === "restaurant" ? RESTAURANT_STEP_TO_PAGE : TICKET_STEP_TO_PAGE;
  const currentPage = pages[target] || "";
  return {
    directedStep: target,
    directedAt: now,
    currentPage,
    step: target,
    // Numbered controls supersede any previous arbitrary-path directive.
    directedPath: null,
    updatedAt: now,
  };
}
