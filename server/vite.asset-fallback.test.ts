import { describe, expect, it } from "vitest";
import { isAssetRequest } from "./_core/static";

describe("asset fallback routing", () => {
  it("recognizes JavaScript and Vite asset requests", () => {
    expect(isAssetRequest("/assets/index-abc123.js")).toBe(true);
    expect(isAssetRequest("/src/main.tsx")).toBe(true);
    expect(isAssetRequest("/assets/styles.css?direct")).toBe(true);
  });

  it("does not classify document routes such as /login as assets", () => {
    expect(isAssetRequest("/login")).toBe(false);
    expect(isAssetRequest("/dashboard")).toBe(false);
  });
});
