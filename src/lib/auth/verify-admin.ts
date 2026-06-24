import type { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getLocalDevSessionUser,
  isLocalDevAuthEnabled,
} from "@/lib/auth/local-dev-auth";
import { guardAdminRateLimit } from "@/lib/server/rate-limiter";

export type VerifyAdminResult = { id: string; email?: string } | Response | null;

export async function verifyAdmin(request?: NextRequest): Promise<VerifyAdminResult> {
  if (request) {
    const limited = await guardAdminRateLimit(request);
    if (limited) return limited;
  }

  if (isLocalDevAuthEnabled()) {
    const user = await getLocalDevSessionUser();
    if (!user || user.role !== "admin") return null;
    return user;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

export function isAdminRateLimited(result: VerifyAdminResult): result is Response {
  return result instanceof Response;
}
