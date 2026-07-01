import { createClient } from "@/lib/supabase/server";
import { isLocalDevAuthEnabled, localDevSignIn } from "@/lib/auth/local-dev-auth";

/** Confirm the current user knows their password before destructive actions (GDPR erasure). */
export async function verifyUserReauth(
  email: string,
  password: string
): Promise<boolean> {
  if (!password || password.length < 8) return false;

  if (isLocalDevAuthEnabled()) {
    try {
      await localDevSignIn({ email, password });
      return true;
    } catch {
      return false;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}
