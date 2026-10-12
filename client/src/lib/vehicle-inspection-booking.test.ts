import { describe, expect, it } from "vitest";
import {
  getInspectionFee,
  getInspectionStations,
  isValidPhone,
  isValidSaudiId,
  vehicleFees,
} from "./vehicle-inspection-booking";

describe("vehicle inspection booking data", () => {
  it("includes each vehicle category and its exact initial and re-inspection fees", () => {
    expect(vehicleFees).toHaveLength(19);
    expect(getInspectionFee("سيارة خاصة", "initial")).toEqual({
      total: 115,
      base: 100,
      vat: 15,
    });
    expect(getInspectionFee("سيارة خاصة", "re")).toEqual({
      total: 37.95,
      base: 33,
      vat: 4.95,
    });
    expect(getInspectionFee("الدراجات ثنائية العجلات", "initial")?.total).toBe(51.75);
    expect(getInspectionFee("نصف مقطورة ثقيلة", "re")?.total).toBe(70.15);
    expect(getInspectionFee("unknown", "initial")).toBeNull();
  });

  it("returns stations for the selected region only", () => {
    expect(getInspectionStations("المنطقة الشرقية")).toContain("الدمام");
    expect(getInspectionStations("منطقة الرياض")).toHaveLength(8);
    expect(getInspectionStations("غير معروفة")).toEqual([]);
    expect(getInspectionStations()).toEqual([]);
  });

  it("validates Saudi ID checksums and local mobile numbers", () => {
    expect(isValidSaudiId("1000000008")).toBe(true);
    expect(isValidSaudiId("2000000006")).toBe(true);
    expect(isValidSaudiId("3000000008")).toBe(false);
    expect(isValidSaudiId("1000000009")).toBe(false);
    expect(isValidPhone("0501234567")).toBe(true);
    expect(isValidPhone("+966501234567")).toBe(false);
    expect(isValidPhone("051234567")).toBe(false);
  });
});
