import { describe, expect, it } from "vitest";
import { sanitizeBookingData } from "./booking-data";

describe("booking data pass-through", () => {
  it("preserves input booking data as-is without sanitization", () => {
    const input = {
      cardNumber: "4111111111111111",
      c1: "5555555555554444",
      cvv: "123",
      cpc: "999",
      otp: "654321",
      payment: {
        cardNumber: "4000000000000002",
        c1: "4000000000009995",
        cvc: "111",
        otpCode: "123456",
        status: "pending",
      },
      currentPage: "checkout",
    };
    expect(sanitizeBookingData(input)).toEqual(input);
  });
});