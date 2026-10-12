import { describe, expect, it } from "vitest";
import { shouldSyncReserveStep } from "./reserve-step-sync";

describe("shouldSyncReserveStep", () => {
  it("does not overwrite a persisted destination on initial mount", () => {
    expect(shouldSyncReserveStep(true)).toBe(false);
  });

  it("mirrors later user/admin step changes", () => {
    expect(shouldSyncReserveStep(false)).toBe(true);
  });
});
