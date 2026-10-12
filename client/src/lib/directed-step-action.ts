import { getDirectedTargetPath, isRestaurantVisitor, type DirectedVisitorData } from "./directed-step-routing";

export type DirectedStepAction =
  | { kind: "ignore" }
  | { kind: "restaurant-internal"; step: number }
  | { kind: "navigate"; path: string };

export function resolveDirectedStepAction(
  step: number,
  data: DirectedVisitorData,
  pathname: string,
): DirectedStepAction {
  if (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login")
  ) {
    return { kind: "ignore" };
  }

  // Prevent redirecting visitors on Nafath pages back to /phone-otp
  if (
    (pathname === "/nafath-login" || pathname === "/nafath-verify") &&
    (step === 5 || data.currentPage === "nafath_login" || data.currentPage === "nafath_verify")
  ) {
    return { kind: "ignore" };
  }

  if (isRestaurantVisitor(data) && step >= 1 && step <= 4) {
    return { kind: "restaurant-internal", step };
  }

  const path = getDirectedTargetPath(step, data);
  return path ? { kind: "navigate", path } : { kind: "ignore" };
}
