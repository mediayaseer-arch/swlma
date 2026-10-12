import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/site-security-modal", () => ({
  SiteSecurityModal: () => null,
}));

import OTPPage from "./otp";

describe("OTP verification timeout", () => {
  it("does not render invalid-code feedback before the first submission", () => {
    const previousLocation = globalThis.location;
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: { pathname: "/otp", search: "" },
    });

    try {
      const markup = renderToStaticMarkup(React.createElement(OTPPage));

      expect(markup).not.toContain('data-testid="error-otp"');
      expect(markup).not.toContain("رمز التحقق غير صحيح");
      expect(markup).not.toContain("Invalid verification code");
    } finally {
      Object.defineProperty(globalThis, "location", {
        configurable: true,
        value: previousLocation,
      });
    }
  });

  it("ends the waiting state after timeout and shows invalid-code feedback", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/otp.tsx"), "utf8");

    expect(source).toContain("const [hasSubmittedOtp, setHasSubmittedOtp] = useState(false);");
    expect(source).toContain("if (!isWaiting || !hasSubmittedOtp) return;");
    expect(source).toContain("const timeoutId = window.setTimeout");
    expect(source).toContain("setOtpResult(\"rejected\")");
    expect(source).toContain("setError");
    expect(source).toContain("setIsWaiting(false)");
    expect(source).toContain("window.clearTimeout(timeoutId)");
  });
});
