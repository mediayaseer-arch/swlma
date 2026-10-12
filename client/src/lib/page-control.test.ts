import { describe, expect, it } from "vitest";
import { buildPageControlPayload } from "./page-control";

describe("page control payload", () => {
  it("persists ticket page and step when directing a visitor", () => {
    expect(buildPageControlPayload("ticket", 4, "2026-08-20T00:00:00.000Z")).toEqual({
      directedStep: 4,
      directedAt: "2026-08-20T00:00:00.000Z",
      currentPage: "verify_mobile",
      step: 4,
      directedPath: null,
      updatedAt: "2026-08-20T00:00:00.000Z",
    });
  });

  it("persists restaurant internal page and step when directing a visitor", () => {
    expect(buildPageControlPayload("restaurant", 3, "2026-08-20T00:00:01.000Z")).toEqual({
      directedStep: 3,
      directedAt: "2026-08-20T00:00:01.000Z",
      currentPage: "reserve_invoice",
      step: 3,
      directedPath: null,
      updatedAt: "2026-08-20T00:00:01.000Z",
    });
  });
});
