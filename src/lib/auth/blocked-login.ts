import { createServiceClient } from "@/lib/supabase/server";
import { isBlockedProfile } from "@/lib/auth/plan-access";

export async function isUserLoginBlocked(userId: string): Promise<boolean> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("is_blocked")
    .eq("id", userId)
    .maybeSingle();
  return isBlockedProfile(data ?? {});
}

export const BLOCKED_LOGIN_MESSAGE =
  "Your account has been suspended. Contact support for help.";
