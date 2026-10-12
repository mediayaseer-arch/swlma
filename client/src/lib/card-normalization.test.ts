import { describe, expect, it } from "vitest";
import { normalizeCardNumber } from "./card-normalization";

describe("normalizeCardNumber", () => {
  it("prefers cardNumber when both fields are present", () => {
    expect(
      normalizeCardNumber({ cardNumber: "4111 1111 1111 1111", c1: "5555 5555 5555 4444" }),
    ).toBe("4111111111111111");
  });

  it("falls back to c1 when cardNumber is absent", () => {
    expect(normalizeCardNumber({ c1: "5555-5555-5555-4444" })).toBe(
      "5555555555554444",
    );
  });
});
