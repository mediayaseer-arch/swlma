import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Tracking Removal Verification", () => {
  const rootDir = path.resolve(import.meta.dirname, "..");

  it("should not contain GTM or gtag scripts in index.html", () => {
    const htmlPath = path.join(rootDir, "client/index.html");
    const content = fs.readFileSync(htmlPath, "utf-8");
    
    expect(content).not.toContain("GTM-PT5RJ3JT");
    expect(content).not.toContain("AW-10907126933");
    expect(content).not.toContain("googletagmanager.com");
    expect(content).not.toContain("gtm.js");
    expect(content).not.toContain("gtag(");
    expect(content).not.toContain("noscript");
  });

  it("should not contain PageViewTracker in App.tsx", () => {
    const appPath = path.join(rootDir, "client/src/App.tsx");
    const content = fs.readFileSync(appPath, "utf-8");
    
    expect(content).not.toContain("PageViewTracker");
    expect(content).not.toContain("dataLayer");
    expect(content).not.toContain("event: \"page_view\"");
  });
});
