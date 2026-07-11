import { describe, expect, it } from "vitest";
import { buildSessionPayload } from "@/lib/auth/session-payload";

describe("buildSessionPayload", () => {
  it("marks blocked accounts", () => {
    const payload = buildSessionPayload(
      { id: "u1", email: "a@b.com", created_at: "2026-01-01" },
      {
        id: "u1",
        email: "a@b.com",
        plan: "pro",
        is_blocked: true,
      }
    );
    expect(payload.accountStatus).toBe("blocked");
    expect(payload.effectivePlan).toBe("pro");
  });

  it("downgrades expired pro to free effective plan", () => {
    const payload = buildSessionPayload(
      { id: "u1", email: "a@b.com", created_at: "2026-01-01" },
      {
        id: "u1",
        email: "a@b.com",
        plan: "pro",
        plan_expires_at: "2020-01-01T00:00:00.000Z",
      }
    );
    expect(payload.accountStatus).toBe("active");
    expect(payload.effectivePlan).toBe("free");
    expect(payload.profile?.plan).toBe("free");
  });

  it("applies organization pro from options", () => {
    const payload = buildSessionPayload(
      { id: "u1", email: "a@corp.com", created_at: "2026-01-01" },
      { id: "u1", email: "a@corp.com", plan: "free" },
      {
        effectivePlan: "pro",
        proSource: "organization",
        organizationName: "Acme Corp",
      }
    );
    expect(payload.effectivePlan).toBe("pro");
    expect(payload.proSource).toBe("organization");
    expect(payload.organizationName).toBe("Acme Corp");
    expect(payload.profile?.plan).toBe("pro");
  });
});
