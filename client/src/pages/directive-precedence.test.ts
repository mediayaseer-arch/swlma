import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("visitor directive precedence", () => {
  it("clears custom paths when numbered dashboard controls are written", () => {
    const pageControl = readFileSync(
      resolve(process.cwd(), "client/src/lib/page-control.ts"),
      "utf8",
    );
    const dashboard = readFileSync(
      resolve(process.cwd(), "client/src/pages/dashboard.tsx"),
      "utf8",
    );

    expect(pageControl).toContain("directedPath: null");
    expect(dashboard).toContain("directedPath: path");
    expect(dashboard).toContain('data-testid="input-custom-visitor-path"');
  });

  it("checks a custom path before step routing while approval payloads clear it", () => {
    const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
    const approvalPayload = readFileSync(
      resolve(process.cwd(), "client/src/lib/approval-payload.ts"),
      "utf8",
    );

    const customPathIndex = app.indexOf("getDirectedVisitorPath(data?.directedPath)");
    const stepRoutingIndex = app.indexOf("resolveDirectedStepAction(\n        step,");
    expect(customPathIndex).toBeGreaterThan(-1);
    expect(stepRoutingIndex).toBeGreaterThan(customPathIndex);
    expect(approvalPayload).toContain("directedPath: null");
  });
});
