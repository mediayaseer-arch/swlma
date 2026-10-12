import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  new URL("../client/src/App.tsx", import.meta.url),
  "utf8",
);

describe("admin route surface", () => {
  it("serves Home at the main page while keeping the dashboard and login routes", () => {
    expect(appSource).toContain('<Route path="/" component={Home} />');
    expect(appSource).toContain('<Route path="/dashboard" component={Admin} />');
    expect(appSource).toContain('<Route path="/login" component={Login} />');
    expect(appSource).toContain('<Route path="/home" component={Home} />');
  });

  it("registers the successful-login destination and preserves the auth guard", () => {
    const loginSource = readFileSync(
      new URL("../client/src/pages/login.tsx", import.meta.url),
      "utf8",
    );
    const dashboardSource = readFileSync(
      new URL("../client/src/pages/dashboard.tsx", import.meta.url),
      "utf8",
    );
    expect(loginSource).toContain('setLocation("/dashboard")');
    expect(appSource).toContain('<Route path="/dashboard" component={Admin} />');
    expect(dashboardSource).toContain("if (authReady && !authUser)");
    expect(dashboardSource).toContain('setLocation("/login")');
  });

  it("keeps the public booking routes registered", () => {
    expect(appSource).toContain('<Route path="/registration" component={BookingPage} />');
    expect(appSource).toContain('<Route path="/checkout" component={CheckoutPage} />');
    expect(appSource).toContain('<Route path="/reserve/:id" component={BookingPage} />');
    expect(appSource).toContain('<Route path="/book-appointment" component={BookingPage} />');
  });
});
