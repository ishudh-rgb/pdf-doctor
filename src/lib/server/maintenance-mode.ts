import { getCachedAdminSettings } from "@/lib/db/admin-settings-cache";

function isTruthySetting(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    const settings = await getCachedAdminSettings();
    return isTruthySetting(settings.maintenance_mode);
  } catch {
    return false;
  }
}

export const MAINTENANCE_MESSAGE =
  "OnlyMyPDF is temporarily down for maintenance. Please check back shortly.";
