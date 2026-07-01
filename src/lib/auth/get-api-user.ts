import { createClient } from "@/lib/supabase/server";
import {
  getLocalDevSessionUser,
  isLocalDevAuthEnabled,
} from "@/lib/auth/local-dev-auth";
import { getUserProfile } from "@/lib/db/queries";
import { isActivePro, isBlockedProfile, UserBlockedError } from "@/lib/auth/plan-access";

export interface ApiUser {
  id: string;
  email: string;
  plan: "free" | "pro";
}

export async function getApiUser(): Promise<ApiUser | null> {
  if (isLocalDevAuthEnabled()) {
    const user = await getLocalDevSessionUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      plan: user.plan,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getUserProfile(user.id);

  if (isBlockedProfile(profile)) {
    throw new UserBlockedError();
  }

  return {
    id: user.id,
    email: user.email ?? "",
    plan: isActivePro(profile) ? "pro" : "free",
  };
}
