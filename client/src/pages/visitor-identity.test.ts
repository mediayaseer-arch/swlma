import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("visitor identity stability", () => {
  it("uses the shared stable ID helper in entry flows", () => {
    const firebase = readFileSync(resolve(process.cwd(), "client/src/lib/firebase.ts"), "utf8");
    const home = readFileSync(
      resolve(process.cwd(), "client/src/pages/home-inspection.tsx"),
      "utf8",
    );
    const registration = readFileSync(resolve(process.cwd(), "client/src/pages/registration.tsx"), "utf8");

    expect(firebase).toContain("export const getOrCreateVisitorId");
    expect(firebase).toContain('localStorage.setItem("visitor", id)');
    expect(home).toContain("getOrCreateVisitorId()");
    expect(registration).toContain("getOrCreateVisitorId()");
    expect(home).not.toContain("visitor_${Date.now()}");
    expect(registration).not.toContain("visitor_${Date.now()}");
  });
});
