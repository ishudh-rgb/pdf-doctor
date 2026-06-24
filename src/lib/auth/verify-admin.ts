import type { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getLocalDevSessionUser,
  isLocalDevAuthEnabled,
} from "@/lib/auth/local-dev-auth";

export async function verifyAdmin(_request?: NextRequest) {
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
