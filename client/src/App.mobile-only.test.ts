import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("MobileOnlyGate transition safety", () => {
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

  it("uses a transition for viewport changes that may lazy-load the fallback route", () => {
    expect(appSource).toContain('startTransition(() =>');
    expect(appSource).toContain('setDesktop(nextDesktop);');
  });

  it("renders the lazy not-found route under a Suspense boundary", () => {
    expect(appSource).toContain('<Suspense fallback={<Loading />}>');
    expect(appSource).toContain('<NotFound />');
  });
});
