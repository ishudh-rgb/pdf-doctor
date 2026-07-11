import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkFileSizeLimit, requireProPlan } from "@/lib/services/usage-limit.service";

vi.mock("@/lib/db/queries", () => ({
  getUserDailyUsage: vi.fn(),
  getGuestDailyUsage: vi.fn(),
  getUserProfile: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/db/admin-settings-cache", () => ({
  getCachedAdminSettings: vi.fn(),
}));

vi.mock("@/lib/enterprise/org-access.service", () => ({
  resolveProAccessForUser: vi.fn(),
}));

import { getUserProfile } from "@/lib/db/queries";
import { getCachedAdminSettings } from "@/lib/db/admin-settings-cache";
import { resolveProAccessForUser } from "@/lib/enterprise/org-access.service";

describe("usage-limit helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCachedAdminSettings).mockResolvedValue({});
    vi.mocked(getUserProfile).mockResolvedValue({ plan: "free" } as never);
  });

  it("allows files under the free size limit", async () => {
    const result = await checkFileSizeLimit(null, 1024);
    expect(result.allowed).toBe(true);
    expect(result.maxSizeMB).toBeGreaterThan(0);
  });

  it("rejects pro-only tools for guests", async () => {
    const result = await requireProPlan(null);
    expect(result.allowed).toBe(false);
    expect(result.message).toContain("log in");
  });

  it("rejects pro-only tools for free users", async () => {
    vi.mocked(resolveProAccessForUser).mockResolvedValue({
      isPro: false,
      source: "individual",
      organizationId: undefined,
    });

    const result = await requireProPlan("user-1");
    expect(result.allowed).toBe(false);
    expect(result.message).toContain("Pro");
  });
});
