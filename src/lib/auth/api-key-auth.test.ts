import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  getUserProfile: vi.fn(),
}));

vi.mock("@/lib/enterprise/organizations.service", () => ({
  getOrganizationMemberRole: vi.fn(),
}));

vi.mock("@/lib/enterprise/org-access.service", () => ({
  resolveProAccessForUser: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/db/queries";
import { getOrganizationMemberRole } from "@/lib/enterprise/organizations.service";
import { resolveProAccessForUser } from "@/lib/enterprise/org-access.service";
import { validateApiKeyFromRequest } from "@/lib/auth/api-key-auth";

function makeRequest(key: string): NextRequest {
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === "x-api-key" ? key : null),
    },
  } as unknown as NextRequest;
}

describe("validateApiKeyFromRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserProfile).mockResolvedValue({ plan: "pro" } as never);
    vi.mocked(resolveProAccessForUser).mockResolvedValue({ isPro: true, source: "individual" });
  });

  it("rejects org-scoped keys when organization plan is inactive", async () => {
    vi.mocked(getOrganizationMemberRole).mockResolvedValue("owner");
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "api_keys") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "key-1",
                    user_id: "user-1",
                    organization_id: "org-1",
                    scopes: ["tools:write"],
                    name: "Team",
                    expires_at: null,
                    revoked_at: null,
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { plan_status: "cancelled", plan_expires_at: null },
                error: null,
              }),
            }),
          }),
        };
      }),
    } as never);

    await expect(
      validateApiKeyFromRequest(makeRequest("omp_" + "a".repeat(48)))
    ).resolves.toBeNull();
  });
});
