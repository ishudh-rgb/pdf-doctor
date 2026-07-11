import { createServiceClient } from "@/lib/supabase/server";
import { getPrimaryOrganizationForUser } from "@/lib/enterprise/org-access.service";
import { resolveProDailyToolLimit } from "@/lib/admin/effective-limits";
import { getCachedAdminSettings } from "@/lib/db/admin-settings-cache";
import { getUserDailyUsage } from "@/lib/db/queries";
import type { UsageLimitResult } from "@/lib/services/usage-limit.service";

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkOrganizationSharedUsageLimit(
  userId: string,
  organizationId: string
): Promise<UsageLimitResult> {
  const supabase = await createServiceClient();
  const today = todayUtcDate();

  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, daily_tool_limit, daily_usage_date, daily_usage_count")
    .eq("id", organizationId)
    .single();

  if (error || !org) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      message: "Organization not found.",
    };
  }

  let used = org.daily_usage_count ?? 0;
  if (org.daily_usage_date !== today) {
    used = 0;
  }

  const limit = org.daily_tool_limit ?? 500;

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    message:
      used >= limit
        ? `Your team's daily limit of ${limit} tool uses has been reached. Resets tomorrow.`
        : undefined,
  };
}

export async function incrementOrganizationDailyUsage(
  organizationId: string
): Promise<void> {
  const supabase = await createServiceClient();
  const today = todayUtcDate();

  const { data: org } = await supabase
    .from("organizations")
    .select("daily_usage_date, daily_usage_count")
    .eq("id", organizationId)
    .single();

  if (!org) return;

  const sameDay = org.daily_usage_date === today;
  const nextCount = sameDay ? (org.daily_usage_count ?? 0) + 1 : 1;

  await supabase
    .from("organizations")
    .update({
      daily_usage_date: today,
      daily_usage_count: nextCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationId);
}

export async function checkUsageLimitWithOrg(
  userId: string,
  // Reserved for per-tool org limits; shared pool applies today.
  tool?: string
): Promise<UsageLimitResult & { organizationId?: string }> {
  void tool;
  const org = await getPrimaryOrganizationForUser(userId);
  if (org) {
    return { ...(await checkOrganizationSharedUsageLimit(userId, org.id)), organizationId: org.id };
  }

  const settings = await getCachedAdminSettings();
  const dailyLimit = resolveProDailyToolLimit(settings);
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
