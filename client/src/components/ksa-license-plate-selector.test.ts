import { describe, expect, it } from "vitest";
import { isValidSaudiPlate } from "@/lib/ksa-license-plate";

describe("Saudi license plate format", () => {
  it("accepts one to four Latin letters followed by one to four digits", () => {
    expect(isValidSaudiPlate("A1")).toBe(true);
    expect(isValidSaudiPlate("AB12")).toBe(true);
    expect(isValidSaudiPlate("RZA2030")).toBe(true);
    expect(isValidSaudiPlate("JHXA0007")).toBe(true);
  });

  it("rejects incomplete or malformed plates", () => {
    expect(isValidSaudiPlate("A")).toBe(false);
    expect(isValidSaudiPlate("1")).toBe(false);
    expect(isValidSaudiPlate("ABCDE1234")).toBe(false);
    expect(isValidSaudiPlate("AB12345")).toBe(false);
    expect(isValidSaudiPlate("RZ12030")).toBe(false);
    expect(isValidSaudiPlate("")).toBe(false);
  });
});
