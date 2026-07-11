import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isLocalDevAuthEnabled } from "@/lib/auth/local-dev-auth";
import { isPasswordRecoverySession } from "@/lib/auth/recovery-session";

export async function GET() {
  if (isLocalDevAuthEnabled() || !isSupabaseConfigured()) {
    return NextResponse.json({ ready: false });
  }

  const supabase = await createClient();
  const ready = await isPasswordRecoverySession(supabase);
  return NextResponse.json({ ready });
}
