import { getAdminSettings } from "@/lib/db/queries";

const TTL_MS = 60_000;

let cached: { data: Record<string, unknown>; expiresAt: number } | null = null;

export async function getCachedAdminSettings(): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  const data = await getAdminSettings();
  cached = { data, expiresAt: now + TTL_MS };
  return data;
}

export function invalidateAdminSettingsCache(): void {
  cached = null;
}
