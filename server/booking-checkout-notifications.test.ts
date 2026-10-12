import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const bookingSource = readFileSync(
  new URL("../client/src/pages/booking.tsx", import.meta.url),
  "utf8",
);
const checkoutSource = readFileSync(
  new URL("../client/src/pages/checkout.tsx", import.meta.url),
  "utf8",
);

describe("booking and checkout notifications", () => {
  it("keeps booking form logic connected to addData and checkout navigation", () => {
    expect(bookingSource).toContain('addData');
    expect(bookingSource).toContain('/checkout');
  });

  it("keeps checkout payment logic connected to handlePay", () => {
    expect(checkoutSource).toContain('handlePay');
    expect(checkoutSource).toContain('setLocation("/otp")');
  });
});
