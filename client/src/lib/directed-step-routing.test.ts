import { describe, expect, it } from "vitest";
import { getDirectedTargetPath, getDirectedVisitorPath } from "./directed-step-routing";

describe("directed step routing", () => {
  it("routes ticket steps to the expected visitor pages", () => {
    expect(getDirectedTargetPath(2, {})).toBe("/checkout");
    expect(getDirectedTargetPath(3, {})).toBe("/otp");
    expect(getDirectedTargetPath(4, {})).toBe("/verify-mobile");
    expect(getDirectedTargetPath(5, {})).toBe("/phone-otp");
    expect(getDirectedTargetPath(6, {})).toBe("/confirmation");
  });

  it("routes restaurant external steps while preserving internal-step ownership", () => {
    const restaurant = { type: "restaurant_reservation" };
    expect(getDirectedTargetPath(4, restaurant)).toBeNull();
    expect(getDirectedTargetPath(5, restaurant)).toBe("/otp");
    expect(getDirectedTargetPath(6, restaurant)).toBe("/confirmation");
  });

  it("does not send visitor flows to the admin root and keeps the public homepage on /home", () => {
    expect(getDirectedVisitorPath("/")).toBeNull();
    expect(getDirectedVisitorPath("/home")).toBe("/home");
  });
});
