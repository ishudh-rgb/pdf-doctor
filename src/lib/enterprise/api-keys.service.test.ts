import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  createUserApiKey,
  ApiKeyOrganizationAccessError,
} from "@/lib/enterprise/api-keys.service";

vi.mock("@/lib/enterprise/organizations.service", () => ({
  getOrganizationMemberRole: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

import { getOrganizationMemberRole } from "@/lib/enterprise/organizations.service";
import { createServiceClient } from "@/lib/supabase/server";

describe("createUserApiKey organization access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows personal keys without organizationId", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "key-1",
        name: "Prod",
        key_prefix: "omp_abc",
        scopes: [],
        created_at: "2026-01-01",
        last_used_at: null,
        expires_at: null,
        revoked_at: null,
      },
      error: null,
    });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ insert }),
    } as never);

    const result = await createUserApiKey("user-1", "Prod");

    expect(getOrganizationMemberRole).not.toHaveBeenCalled();
    expect(result.secret).toMatch(/^omp_/);
  });

  it("rejects org-scoped keys when user is not owner or admin", async () => {
    vi.mocked(getOrganizationMemberRole).mockResolvedValue("member");

    await expect(createUserApiKey("user-1", "Team key", "org-1")).rejects.toBeInstanceOf(
      ApiKeyOrganizationAccessError
    );
  });

  it("rejects org-scoped keys when team plan is inactive", async () => {
    vi.mocked(getOrganizationMemberRole).mockResolvedValue("owner");
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { plan_status: "inactive", plan_expires_at: null },
                error: null,
              }),
          }),
        }),
      }),
    } as never);

    await expect(createUserApiKey("user-1", "Team key", "org-1")).rejects.toMatchObject({
      message: expect.stringContaining("team plan must be active"),
    });
  });

  it("creates org-scoped keys for org admins with active plan", async () => {
    vi.mocked(getOrganizationMemberRole).mockResolvedValue("admin");

    const single = vi.fn().mockResolvedValue({
      data: {
        id: "key-2",
        name: "Team key",
        key_prefix: "omp_xyz",
        scopes: [],
        created_at: "2026-01-01",
        last_used_at: null,
        expires_at: null,
        revoked_at: null,
      },
      error: null,
    });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });

    vi.mocked(createServiceClient)
      .mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { plan_status: "active", plan_expires_at: null },
                error: null,
              }),
            }),
          }),
        }),
      } as never)
      .mockResolvedValueOnce({
        from: vi.fn().mockReturnValue({ insert }),
      } as never);

    const result = await createUserApiKey("user-1", "Team key", "org-1");

    expect(result.record.id).toBe("key-2");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org-1",
        user_id: "user-1",
      })
    );
  });
});
