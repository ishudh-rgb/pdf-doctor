import { getUserProfile } from "@/lib/db/queries";
import { getCachedAdminSettings } from "@/lib/db/admin-settings-cache";
import { FILE_LIMITS } from "@/config/constants";

export type ToolUserContext = {
  settings: Record<string, unknown>;
  profile: Awaited<ReturnType<typeof getUserProfile>> | null;
  isPro: boolean;
  maxSizeMB: number;
};

export async function resolveToolUserContext(
  userId: string | null
): Promise<ToolUserContext> {
  const settings = await getCachedAdminSettings();

  if (!userId) {
    return {
      settings,
      profile: null,
      isPro: false,
      maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB,
    };
  }

  const profile = await getUserProfile(userId);
  const isPro = profile.plan === "pro";

  return {
    settings,
    profile,
    isPro,
    maxSizeMB: isPro ? FILE_LIMITS.maxProFileSizeMB : FILE_LIMITS.maxFreeFileSizeMB,
  };
}
