import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries", () => ({
  getUserConsentRecords: vi.fn(),
  logConsentRecord: vi.fn(),
}));

vi.mock("@/lib/privacy/guest-session", () => ({
  getGuestSessionIdFromRequest: vi.fn(() => "guest-session-1"),
}));

vi.mock("@/lib/server/client-ip", () => ({
  getGuestUsageKey: vi.fn(() => "guest-key"),
}));

vi.mock("@/lib/server/rate-limiter", () => ({
  guardGeneralApiRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/get-api-user", () => ({
  tryGetApiUser: vi.fn(),
}));

vi.mock("@/lib/server/mutation-origin", () => ({
  guardMutationOrigin: vi.fn(),
}));

import { getUserConsentRecords, logConsentRecord } from "@/lib/db/queries";
import { guardGeneralApiRateLimit } from "@/lib/server/rate-limiter";
import { tryGetApiUser } from "@/lib/auth/get-api-user";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { POST as consentPOST, GET as consentGET } from "@/app/api/privacy/consent/route";

function requestJson(body: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers({ "user-agent": "vitest" }),
  } as unknown as NextRequest;
}

describe("privacy consent routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(guardGeneralApiRateLimit).mockResolvedValue(null);
    vi.mocked(guardMutationOrigin).mockReturnValue(null);
    vi.mocked(tryGetApiUser).mockResolvedValue({
      ok: true,
      user: { id: "user-1", email: "user@example.com" },
    } as never);
    vi.mocked(getUserConsentRecords).mockResolvedValue([
      {
        consent_version: "2026-01",
        essential: true,
        analytics: false,
        marketing: false,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ] as never);
    vi.mocked(logConsentRecord).mockResolvedValue(undefined as never);
  });

  it("returns stored consent preferences", async () => {
    const response = await consentGET(requestJson(null));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.consent.analytics).toBe(false);
  });

  it("updates consent preferences for authenticated users", async () => {
    const response = await consentPOST(
      requestJson({
        analytics: true,
        marketing: false,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(logConsentRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        analytics: true,
        marketing: false,
      })
    );
  });
});
