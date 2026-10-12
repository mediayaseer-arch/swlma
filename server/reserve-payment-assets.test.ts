import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const checkoutSource = readFileSync(
  new URL("../client/src/pages/checkout.tsx", import.meta.url),
  "utf8",
);
const reserveSource = readFileSync(
  new URL("../client/src/pages/reserve.tsx", import.meta.url),
  "utf8",
);

describe("reservation payment assets", () => {
  it("uses mada, mastercard, and visa payment badges in checkout", () => {
    expect(checkoutSource).toContain('/mada.png');
    expect(checkoutSource).toContain('/master.svg');
    expect(checkoutSource).toContain('/visa.png');
  });
});
