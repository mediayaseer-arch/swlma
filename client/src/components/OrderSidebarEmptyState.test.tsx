import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderSidebarEmptyState } from "./OrderSidebarEmptyState";

describe("OrderSidebarEmptyState", () => {
  it("renders the loading state when the eligible sidebar list is empty", () => {
    const html = renderToStaticMarkup(
      <OrderSidebarEmptyState loading={true} count={0} />,
    );
    expect(html).toContain(">...</div>");
  });

  it("renders the Arabic empty message when no eligible visitors remain", () => {
    const html = renderToStaticMarkup(
      <OrderSidebarEmptyState loading={false} count={0} />,
    );
    expect(html).toContain("لا يوجد زوار");
  });

  it("renders nothing when at least one eligible visitor exists", () => {
    const html = renderToStaticMarkup(
      <OrderSidebarEmptyState loading={false} count={1} />,
    );
    expect(html).toBe("");
  });
});
