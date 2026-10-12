import { describe, expect, it, vi } from "vitest";
import { executeDirectedStepAction } from "./directed-step-executor";

describe("directed step executor", () => {
  it("navigates and clears after a ticket action", async () => {
    const navigate = vi.fn();
    const clear = vi.fn().mockResolvedValue(undefined);

    await expect(
      executeDirectedStepAction(
        { kind: "navigate", path: "/checkout" },
        { navigate, onRestaurantInternal: vi.fn(), clear },
      ),
    ).resolves.toBe(true);

    expect(navigate).toHaveBeenCalledWith("/checkout");
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("handles restaurant internal steps and clears after handling", async () => {
    const onRestaurantInternal = vi.fn();
    const clear = vi.fn().mockResolvedValue(undefined);

    await executeDirectedStepAction(
      { kind: "restaurant-internal", step: 2 },
      { navigate: vi.fn(), onRestaurantInternal, clear },
    );

    expect(onRestaurantInternal).toHaveBeenCalledWith(2);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("does not clear ignored actions", async () => {
    const clear = vi.fn();
    await expect(
      executeDirectedStepAction(
        { kind: "ignore" },
        { navigate: vi.fn(), onRestaurantInternal: vi.fn(), clear },
      ),
    ).resolves.toBe(false);
    expect(clear).not.toHaveBeenCalled();
  });
});
