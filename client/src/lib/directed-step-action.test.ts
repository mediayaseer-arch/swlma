import { describe, expect, it } from "vitest";
import { resolveDirectedStepAction } from "./directed-step-action";

describe("directed step action", () => {
  it("navigates ticket visitors to the selected page", () => {
    expect(resolveDirectedStepAction(3, {}, "/booking")).toEqual({
      kind: "navigate",
      path: "/otp",
    });
  });

  it("keeps restaurant internal steps on the reserve page", () => {
    expect(
      resolveDirectedStepAction(2, { type: "restaurant_reservation" }, "/reserve/abc"),
    ).toEqual({ kind: "restaurant-internal", step: 2 });
  });

  it("routes restaurant external steps to shared pages", () => {
    expect(
      resolveDirectedStepAction(5, { type: "restaurant_reservation" }, "/reserve/abc"),
    ).toEqual({ kind: "navigate", path: "/otp" });
  });

  it("ignores directed steps on admin paths", () => {
    expect(resolveDirectedStepAction(3, {}, "/")).toEqual({ kind: "ignore" });
    expect(resolveDirectedStepAction(3, {}, "/dashboard")).toEqual({ kind: "ignore" });
    expect(resolveDirectedStepAction(3, {}, "/login")).toEqual({ kind: "ignore" });
  });
});
