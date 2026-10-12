import { describe, expect, it } from "vitest";
import express from "express";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { registerRoutes } from "./routes";

function registeredPaths(app: express.Express): string[] {
  const router = (app as any).router;
  return (router?.stack ?? [])
    .filter((layer: any) => layer.route)
    .map((layer: any) => layer.route.path.toString());
}

describe("Diriyah migration contracts", () => {
  it("registers every required legacy API endpoint", async () => {
    const app = express();
    const server = createServer(app);
    await registerRoutes(server, app);
    const paths = registeredPaths(app);

    for (const required of [
      "/api/db/:collection/:id",
      "/api/db/:collection",
      "/api/auth/login",
      "/api/auth/me",
      "/api/auth/logout",
      "/api/bin-lookup/:bin",
      "/api/visitor-ip",
      "/api/send-confirmation-email",
    ]) {
      expect(paths).toContain(required);
    }
    server.close();
  });

  it("keeps Supabase configuration out of browser source and preserves dashboard polling controls", async () => {
    const clientSource = await readFile("client/src/lib/firebase.ts", "utf8");
    const dashboardSource = await readFile("client/src/pages/dashboard.tsx", "utf8");
    const presenceSource = await readFile("client/src/lib/presence.ts", "utf8");

    expect(clientSource).not.toMatch(/SUPABASE_(URL|SECRET_KEY|PUBLISHABLE_KEY|JWKS_URL)/);
    expect(clientSource).not.toMatch(/sb_secret_|sb_publishable_/);
    expect(clientSource).toMatch(
      /const rows = await api<any\[]>\(\s*`\/api\/db\/\$\{encodeURIComponent\(target\.collection\)\}`\s*\)/,
    );
    expect(clientSource).toContain('credentials: "same-origin"');
    expect(clientSource).toContain('Object.prototype.hasOwnProperty.call(body, "data")');
    expect(clientSource).toContain('keepalive: true');
    expect(clientSource).toContain('const blocked = Boolean(await fetchRow("blocked_bins", bin))');
    expect(clientSource).toContain("Server-side Supabase is the only database connection");
    expect(clientSource).toContain("getDocs");
    expect(clientSource).toContain("listenForApproval");
    expect(clientSource).toContain("listenForOtpApproval");
    expect(clientSource).toContain("listenForIpBlock");
    expect(clientSource).toContain("blocked_bins");
    expect(clientSource).toContain("settings");
    expect(dashboardSource).toContain("cardApprovalStatus");
    expect(dashboardSource).toContain("otpApprovalStatus");
    expect(dashboardSource).toContain("settings");
    expect(dashboardSource).toContain('import { isPresenceOnline } from "@/lib/presence"');
    expect(presenceSource).toContain("const PRESENCE_STALE_MS = 75_000");
    expect(presenceSource).toContain("record.lastSeen || record.updatedAt");
    expect(dashboardSource).toContain('onSnapshot(q,');
    expect(dashboardSource).toContain('collection(db, "pays")');
    expect(dashboardSource).not.toMatch(/if \(!db\)\s*(?:\{\s*)?setLoading\(false\)/);
    expect(dashboardSource).not.toMatch(/if \(!db\) return/);
  });
});
