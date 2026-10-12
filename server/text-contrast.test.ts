import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  new URL("../client/src/pages/home-inspection.tsx", import.meta.url),
  "utf8",
);
const detailSource = readFileSync(
  new URL("../client/src/pages/restaurant-detail.tsx", import.meta.url),
  "utf8",
);

describe("visitor button text contrast", () => {
  it("keeps the main booking CTA readable against green backgrounds", () => {
    expect(homeSource).toContain("text-[#126447]");
    expect(detailSource).toContain("!text-white\n                hover:!text-white\n                text-center\n                py-4");
  });

  it("keeps the hero back-link label readable over the image", () => {
    expect(detailSource).toContain("!text-white\n              hover:!text-white\n              px-4");
  });
});
