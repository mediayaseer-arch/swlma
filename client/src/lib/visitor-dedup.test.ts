import { describe, expect, it } from "vitest";
import { collapseDuplicateVisitors } from "./visitor-dedup";

describe("collapseDuplicateVisitors", () => {
  it("preserves an anonymous visitor when an identified visitor shares the same IP", () => {
    const result = collapseDuplicateVisitors([
      { id: "anonymous", ip: "10.0.0.1", currentPage: "registration", updatedAt: "2026-01-01T00:00:00Z" },
      { id: "identified", ip: "10.0.0.1", name: "Visitor", email: "visitor@example.com", updatedAt: "2026-01-01T00:01:00Z" },
    ]);

    expect(result.map((visitor) => visitor.id)).toEqual(["anonymous", "identified"]);
  });

  it("collapses exact contact duplicates and keeps separate identified visitors", () => {
    const result = collapseDuplicateVisitors([
      { id: "old", email: "visitor@example.com", name: "Visitor", updatedAt: "2026-01-01T00:00:00Z" },
      { id: "new", email: "VISITOR@example.com", name: "Visitor", phone: "+966500000000", updatedAt: "2026-01-01T00:02:00Z" },
      { id: "other", email: "other@example.com", ip: "10.0.0.1", name: "Other" },
    ]);

    expect(result.map((visitor) => visitor.id)).toEqual(["new", "other"]);
  });
});

  it("collapses visitors with the exact same ID even if they are anonymous", () => {
    const result = collapseDuplicateVisitors([
      { id: "v1", ip: "10.0.0.1", updatedAt: "2026-01-01T00:00:00Z" },
      { id: "v1", ip: "10.0.0.1", currentPage: "checkout", updatedAt: "2026-01-01T00:01:00Z" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("v1");
    expect(result[0].currentPage).toBe("checkout");
  });
