import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getActiveOrganizationsForUser,
  getPrimaryOrganizationForUser,
  resolveProAccessForUser,
} from "@/lib/enterprise/org-access.service";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  getUserProfile: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/db/queries";

const activeOrg = {
  id: "org-1",
  name: "Acme",
  plan_status: "active",
  plan_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  daily_tool_limit: 500,
};

describe("org-access.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty list when organization lookup errors", async () => {
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: "missing table" } }),
        }),
      }),
    } as never);

    await expect(getActiveOrganizationsForUser("user-1")).resolves.toEqual([]);
  });

  it("filters inactive organizations and returns active org rows", async () => {
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { organizations: activeOrg },
              {
                organizations: {
                  ...activeOrg,
                  id: "org-2",
                  plan_status: "cancelled",
                },
              },
            ],
            error: null,
          }),
        }),
      }),
    } as never);

    await expect(getActiveOrganizationsForUser("user-1")).resolves.toEqual([activeOrg]);
  });

  it("resolves individual pro access from profile", async () => {
    vi.mocked(getUserProfile).mockResolvedValue({
      plan: "pro",
      plan_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    } as never);

    await expect(resolveProAccessForUser("user-1")).resolves.toEqual({
      isPro: true,
      source: "individual",
    });
  });

  it("resolves organization pro access when user belongs to active org", async () => {
    vi.mocked(getUserProfile).mockResolvedValue({ plan: "free" } as never);
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ organizations: activeOrg }],
            error: null,
          }),
        }),
      }),
    } as never);

    await expect(resolveProAccessForUser("user-1")).resolves.toEqual({
      isPro: true,
      source: "organization",
      organizationId: "org-1",
      organizationName: "Acme",
    });
  });

  it("returns none when user has no pro profile or active org", async () => {
    vi.mocked(getUserProfile).mockResolvedValue({ plan: "free" } as never);
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as never);

    await expect(resolveProAccessForUser("user-1")).resolves.toEqual({
      isPro: false,
      source: "none",
    });
  });

  it("returns primary organization for user", async () => {
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ organizations: activeOrg }],
            error: null,
          }),
        }),
      }),
    } as never);

    await expect(getPrimaryOrganizationForUser("user-1")).resolves.toEqual(activeOrg);
  });
});
