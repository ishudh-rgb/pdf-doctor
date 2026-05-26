import {
  getUserDailyUsage,
  getGuestDailyUsage,
  getUserProfile,
  getAdminSettings,
} from "@/lib/db/queries";
import { logError } from "@/lib/db/queries";
import { isLocalDevAuthEnabled } from "@/lib/auth/auth-config";

export interface UsageLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  message?: string;
}

export async function checkUsageLimit(
  userId: string | null,
  guestIpHash: string | null,
  tool: string = "general"
): Promise<UsageLimitResult> {
  try {
    const settings = await getAdminSettings();

    if (userId) {
      const profile = await getUserProfile(userId);
      const isPro = profile.plan === "pro";

      if (isPro) {
        return { allowed: true, remaining: -1, limit: -1 };
      }

      const dailyLimit =
        typeof settings.free_daily_limit === "number"
          ? settings.free_daily_limit
          : Number(settings.free_daily_limit) || 5;
      const used = await getUserDailyUsage(userId);

      return {
        allowed: used < dailyLimit,
        remaining: Math.max(0, dailyLimit - used),
        limit: dailyLimit,
        message:
          used >= dailyLimit
            ? `Daily limit of ${dailyLimit} files reached. Upgrade to Pro for unlimited access.`
            : undefined,
      };
    }

    if (guestIpHash) {
      const dailyLimit =
        typeof settings.free_daily_limit === "number"
          ? settings.free_daily_limit
          : Number(settings.free_daily_limit) || 5;
      const used = await getGuestDailyUsage(guestIpHash);

      return {
        allowed: used < dailyLimit,
        remaining: Math.max(0, dailyLimit - used),
        limit: dailyLimit,
        message:
          used >= dailyLimit
            ? `Daily limit of ${dailyLimit} files reached. Sign up or upgrade to Pro for more.`
            : undefined,
      };
    }

    return {
      allowed: true,
      remaining: 5,
      limit: 5,
    };
  } catch (err) {
    await logError({
      user_id: userId,
      tool_name: tool,
      error_type: "USAGE_LIMIT_CHECK_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return { allowed: true, remaining: 1, limit: 1 };
  }
}

export async function checkAIUsageLimit(
  userId: string,
  plan: "free" | "pro" = "free"
): Promise<UsageLimitResult> {
  try {
    if (isLocalDevAuthEnabled()) {
      if (plan === "pro") {
        return { allowed: true, remaining: -1, limit: -1 };
      }

      return { allowed: true, remaining: 3, limit: 3 };
    }

    const settings = await getAdminSettings();
    const profile = await getUserProfile(userId);
    const isPro = profile.plan === "pro";

    if (isPro) {
      return { allowed: true, remaining: -1, limit: -1 };
    }

    const dailyLimit =
      typeof settings.free_daily_ai_limit === "number"
        ? settings.free_daily_ai_limit
        : Number(settings.free_daily_ai_limit) || 1;

    const used = await getUserDailyUsage(userId, "ai-pdf-summarizer");

    return {
      allowed: used < dailyLimit,
      remaining: Math.max(0, dailyLimit - used),
      limit: dailyLimit,
      message:
        used >= dailyLimit
          ? `Daily AI summary limit of ${dailyLimit} reached. Upgrade to Pro for unlimited AI summaries.`
          : undefined,
    };
  } catch (err) {
    await logError({
      user_id: userId,
      tool_name: "ai-pdf-summarizer",
      error_type: "AI_LIMIT_CHECK_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return { allowed: false, remaining: 0, limit: 1, message: "Error checking AI usage limit." };
  }
}

export async function checkFileSizeLimit(
  userId: string | null,
  fileSizeBytes?: number
): Promise<{ allowed: boolean; maxSizeMB: number }> {
  try {
    const settings = await getAdminSettings();
    let maxSizeMB = Number(settings.free_max_file_size_mb) || 25;

    if (userId) {
      const profile = await getUserProfile(userId);
      if (profile.plan === "pro") {
        maxSizeMB = Number(settings.pro_max_file_size_mb) || 200;
      }
    }

    if (fileSizeBytes === undefined) {
      return { allowed: true, maxSizeMB };
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    return {
      allowed: fileSizeBytes <= maxBytes,
      maxSizeMB,
    };
  } catch (err) {
    await logError({
      user_id: userId,
      error_type: "FILE_SIZE_CHECK_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return { allowed: true, maxSizeMB: 25 };
  }
}
