import { describe, expect, it } from "vitest";
import { adaptVisitor } from "./dashboard";

describe("adaptVisitor payment card mapping", () => {
  it("prefers raw.cardNumber for payment.cardNumber", () => {
    const visitor = adaptVisitor({
      id: "preferred-card",
      cardNumber: "4111 1111 1111 1111",
      c1: "5555 5555 5555 4444",
    });

    expect(visitor.payment.cardNumber).toBe("4111 1111 1111 1111");
  });

  it("falls back to raw.c1 for payment.cardNumber", () => {
    const visitor = adaptVisitor({
      id: "legacy-card",
      c1: "5555-5555-5555-4444",
    });

    expect(visitor.payment.cardNumber).toBe("5555-5555-5555-4444");
  });
});
