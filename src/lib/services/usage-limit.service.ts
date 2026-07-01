import {
  getUserDailyUsage,
  getGuestDailyUsage,
  getUserProfile,
} from "@/lib/db/queries";
import { getCachedAdminSettings } from "@/lib/db/admin-settings-cache";
import { resolveToolUserContext } from "@/lib/services/user-tool-context.service";
import { logError } from "@/lib/db/queries";
import { isLocalDevAuthEnabled } from "@/lib/auth/auth-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { isActivePro } from "@/lib/auth/plan-access";
import {
  FILE_LIMITS,
  isUnlimitedFileSizeMB,
} from "@/config/constants";
import type { NextRequest } from "next/server";
import { getGuestUsageKey } from "@/lib/server/client-ip";

function resolveGuestKey(guestIpHash: string | null | NextRequest): string {
  if (guestIpHash && typeof guestIpHash === "object" && "headers" in guestIpHash) {
    return getGuestUsageKey(guestIpHash);
  }
  if (typeof guestIpHash === "string" && guestIpHash.trim()) {
    return guestIpHash.trim();
  }
  return "unknown-guest";
}

export interface UsageLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  message?: string;
}

function resolveFreeDailyLimit(settings: Record<string, unknown>): number {
  const raw = settings.free_daily_limit ?? settings.free_daily_file_limit;
  if (typeof raw === "number") return raw;
  return Number(raw) || 5;
}

export async function checkUsageLimit(
  userId: string | null,
  guestIpHash: string | null | NextRequest,
  tool: string = "general"
): Promise<UsageLimitResult> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        message: "Service temporarily unavailable. Please try again shortly.",
      };
    }
    return { allowed: true, remaining: -1, limit: -1 };
  }

  try {
    const settings = await getCachedAdminSettings();

    if (userId) {
      const profile = await getUserProfile(userId);
      const isPro = isActivePro(profile);

      if (isPro) {
        const dailyLimit = FILE_LIMITS.maxProUsesPerDay;
        const used = await getUserDailyUsage(userId);

        return {
          allowed: used < dailyLimit,
          remaining: Math.max(0, dailyLimit - used),
          limit: dailyLimit,
          message:
            used >= dailyLimit
              ? `Daily Pro limit of ${dailyLimit} tool uses reached. Resets tomorrow.`
              : undefined,
        };
      }

      const dailyLimit = resolveFreeDailyLimit(settings);
      const used = await getUserDailyUsage(userId);

      return {
        allowed: used < dailyLimit,
        remaining: Math.max(0, dailyLimit - used),
        limit: dailyLimit,
        message:
          used >= dailyLimit
            ? `Daily limit of ${dailyLimit} files reached. Upgrade to Pro for ${FILE_LIMITS.maxProUsesPerDay} uses per day.`
            : undefined,
      };
    }

    const guestKey = resolveGuestKey(guestIpHash);
    const dailyLimit = resolveFreeDailyLimit(settings);
    const used = await getGuestDailyUsage(guestKey);

    return {
      allowed: used < dailyLimit,
      remaining: Math.max(0, dailyLimit - used),
      limit: dailyLimit,
      message:
        used >= dailyLimit
          ? `Daily limit of ${dailyLimit} files reached. Sign up or upgrade to Pro for more.`
          : undefined,
    };
  } catch (err) {
    await logError({
      user_id: userId,
      tool_name: tool,
      error_type: "USAGE_LIMIT_CHECK_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    }).catch(() => {});
    return { allowed: false, remaining: 0, limit: 0, message: "Service temporarily unavailable. Please try again shortly." };
  }
}

export async function requireProPlan(userId: string | null): Promise<UsageLimitResult> {
  if (!userId) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      message: "Please log in and upgrade to Pro to use this tool.",
    };
  }

  try {
    const profile = await getUserProfile(userId);
    if (!isActivePro(profile)) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        message: "This tool requires a Pro subscription. Upgrade to continue.",
      };
    }
    return checkUsageLimit(userId, null, "pro-tool");
  } catch {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      message: "Service temporarily unavailable. Please try again shortly.",
    };
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

    const settings = await getCachedAdminSettings();
    const profile = await getUserProfile(userId);
    const isPro = isActivePro(profile);

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
  fileSizeBytes?: number,
  context?: Awaited<ReturnType<typeof resolveToolUserContext>>
): Promise<{ allowed: boolean; maxSizeMB: number }> {
  try {
    let maxSizeMB = FILE_LIMITS.maxFreeFileSizeMB;

    if (userId) {
      const profile = context?.profile ?? (await getUserProfile(userId));
      if (isActivePro(profile)) {
        maxSizeMB = FILE_LIMITS.maxProFileSizeMB;
      }
    } else if (context) {
      maxSizeMB = context.maxSizeMB;
    }

    if (isUnlimitedFileSizeMB(maxSizeMB)) {
      return { allowed: true, maxSizeMB: 0 };
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
    return { allowed: false, maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
  }
}
