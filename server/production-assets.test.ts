import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import express from "express";
import { createServer } from "node:http";

describe("production asset regression", () => {
  it("does not inject the development debug collector into the production HTML shell", () => {
    const source = readFileSync(path.resolve(process.cwd(), "vite.config.ts"), "utf8");
    expect(source).toContain('apply: "serve"');
    expect(readFileSync(path.resolve(process.cwd(), "client/index.html"), "utf8")).not.toContain("/__manus__/debug-collector.js");

    const builtIndex = path.resolve(process.cwd(), "dist/public/index.html");
    if (existsSync(builtIndex)) {
      expect(readFileSync(builtIndex, "utf8")).not.toContain("/__manus__/debug-collector.js");
    }
  });

  it("serves generated JavaScript instead of falling through to the HTML fallback", async () => {
    const publicDir = path.resolve(process.cwd(), "dist/public");
    const indexPath = path.join(publicDir, "index.html");
    if (!existsSync(indexPath)) return;

    const html = readFileSync(indexPath, "utf8");
    const assetMatch = html.match(/src="(\/assets\/[^\"]+\.js)"/);
    expect(assetMatch?.[1]).toBeTruthy();

    const app = express();
    app.use(express.static(publicDir));
    app.use((_req, res) => res.sendFile(indexPath));
    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const response = await fetch(`http://127.0.0.1:${port}${assetMatch![1]}`);
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/javascript");
      expect(body.trimStart().startsWith("<")).toBe(false);
    } finally {
      server.close();
    }
  });
});
