import { NextResponse } from "next/server";
import { tryGetApiUser } from "@/lib/auth/get-api-user";
import { createClient } from "@/lib/supabase/server";
import { toSafeApiError } from "@/lib/server/safe-error";
import { authGuardResponse } from "@/lib/server/auth-guard-http";

export async function GET() {
  try {
    const auth = await tryGetApiUser({ skipMfaAssurance: true });
    if (!auth.ok) return auth.response;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const verified = (data.totp ?? []).filter((f) => f.status === "verified");
    return NextResponse.json({
      enabled: verified.length > 0,
      factors: verified.map((f) => ({
        id: f.id,
        friendlyName: f.friendly_name,
        createdAt: f.created_at,
      })),
    });
  } catch (err) {
    const guarded = authGuardResponse(err);
    if (guarded) return guarded;
    return NextResponse.json({ error: toSafeApiError(err, "Failed to load MFA status") }, { status: 500 });
  }
}
