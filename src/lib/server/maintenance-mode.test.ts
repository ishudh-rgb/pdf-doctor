import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/admin-settings-cache", () => ({
  getCachedAdminSettings: vi.fn(),
}));

import { getCachedAdminSettings } from "@/lib/db/admin-settings-cache";
import { isMaintenanceModeEnabled, MAINTENANCE_MESSAGE } from "@/lib/server/maintenance-mode";

describe("maintenance-mode", () => {
  beforeEach(() => {
    vi.mocked(getCachedAdminSettings).mockReset();
  });

  it("exports a user-facing maintenance message", () => {
    expect(MAINTENANCE_MESSAGE).toMatch(/maintenance/i);
  });

  it("returns false when maintenance_mode is off", async () => {
    vi.mocked(getCachedAdminSettings).mockResolvedValue({ maintenance_mode: false });
    await expect(isMaintenanceModeEnabled()).resolves.toBe(false);
  });

  it("returns true for boolean, string, and numeric truthy settings", async () => {
    vi.mocked(getCachedAdminSettings).mockResolvedValueOnce({ maintenance_mode: true });
    await expect(isMaintenanceModeEnabled()).resolves.toBe(true);

    vi.mocked(getCachedAdminSettings).mockResolvedValueOnce({ maintenance_mode: "true" });
    await expect(isMaintenanceModeEnabled()).resolves.toBe(true);

    vi.mocked(getCachedAdminSettings).mockResolvedValueOnce({ maintenance_mode: 1 });
    await expect(isMaintenanceModeEnabled()).resolves.toBe(true);
  });

  it("returns false when settings lookup fails", async () => {
    vi.mocked(getCachedAdminSettings).mockRejectedValue(new Error("redis down"));
    await expect(isMaintenanceModeEnabled()).resolves.toBe(false);
  });
});
