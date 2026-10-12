import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";

export function isAssetRequest(urlPath: string) {
  return /\/(?:assets|src|@vite|node_modules)\//.test(urlPath) || /\.(?:js|mjs|css|map|json|wasm|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico)(?:$|\?)/i.test(urlPath);
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));
  app.use((req, res) => {
    if (isAssetRequest(req.path)) {
      return res.status(404).type("text/plain").send("Asset not found");
    }
    return res.sendFile(path.resolve(distPath, "index.html"));
  });
}