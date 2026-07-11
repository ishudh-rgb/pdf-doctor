import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

describe("buildContentSecurityPolicy", () => {
  it("uses nonce and strict-dynamic in production without unsafe-inline scripts", () => {
    const csp = buildContentSecurityPolicy("abc123", true);
    expect(csp).toContain("'nonce-abc123'");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).not.toContain("script-src 'unsafe-inline'");
  });

  it("allows unsafe-eval in development scripts", () => {
    const csp = buildContentSecurityPolicy("devnonce", false);
    expect(csp).toContain("'unsafe-eval'");
  });
});
