import { describe, expect, it } from "vitest";
import { RESTAURANTS, getRestaurantById } from "../client/src/lib/restaurant-data";

describe("official Diriyah restaurant catalog", () => {
  it("contains all 30 listings from the official directory", () => {
    expect(RESTAURANTS).toHaveLength(30);
    expect(new Set(RESTAURANTS.map((restaurant) => restaurant.officialUrl)).size).toBe(30);
  });

  it("keeps every listing renderable with official imagery and a stable numeric id", () => {
    expect(RESTAURANTS.every((restaurant) =>
      Number.isInteger(restaurant.id) &&
      restaurant.name.trim().length > 0 &&
      restaurant.nameEn.trim().length > 0 &&
      restaurant.bgImage.startsWith("https://assets-diriyah.diriyah.me/") &&
      restaurant.logo.startsWith("https://assets-diriyah.diriyah.me/")
    )).toBe(true);
    expect(new Set(RESTAURANTS.map((restaurant) => restaurant.id)).size).toBe(30);
  });

  it("preserves legacy reservation lookups and official booking links", () => {
    expect(getRestaurantById(1)?.officialUrl).toBe("https://www.diriyah.sa/ar/dine/brunch-and-cake");
    expect(getRestaurantById(17)?.bookingUrl).toContain("/17/altopiano");
    expect(getRestaurantById(20)?.name).toBe("ميزون أسولين");
    expect(getRestaurantById(23)?.nameEn).toBe("AOK Kitchen");
    expect(RESTAURANTS.filter((restaurant) => restaurant.bookingUrl).length).toBeGreaterThan(15);
  });
});
