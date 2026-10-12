import { describe, expect, it } from "vitest";
import {
  isAdminPath,
  isDesktopViewport,
  shouldShowMobileOnlyNotFound,
} from "./mobile-only";

describe("mobile-only access policy", () => {
  it("treats widths below 768px as mobile", () => {
    expect(isDesktopViewport(375)).toBe(false);
    expect(isDesktopViewport(767)).toBe(false);
    expect(isDesktopViewport(768)).toBe(true);
  });

  it("shows the not-found fallback for public desktop routes", () => {
    expect(shouldShowMobileOnlyNotFound("/", 1280)).toBe(false);
    expect(shouldShowMobileOnlyNotFound("/home", 1280)).toBe(true);
    expect(shouldShowMobileOnlyNotFound("/restaurants", 1024)).toBe(true);
    expect(shouldShowMobileOnlyNotFound("/checkout", 767)).toBe(false);
  });

  it("keeps admin and login routes accessible on desktop", () => {
    expect(isAdminPath("/")).toBe(false);
    expect(isAdminPath("/dashboard")).toBe(true);
    expect(isAdminPath("/dashboard/visitors")).toBe(true);
    expect(isAdminPath("/login")).toBe(true);
    expect(shouldShowMobileOnlyNotFound("/", 1280)).toBe(false);
    expect(shouldShowMobileOnlyNotFound("/dashboard", 1280)).toBe(false);
    expect(shouldShowMobileOnlyNotFound("/login", 1280)).toBe(false);
  });
});
