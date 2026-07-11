import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { checkAuthRateLimit, rateLimitResponse } from "@/lib/server/rate-limiter";
import { toSafeApiError } from "@/lib/server/safe-error";

export async function POST(request: NextRequest) {
  try {
    const originBlocked = guardMutationOrigin(request);
    if (originBlocked) return originBlocked;

    const rate = await checkAuthRateLimit(request);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
    });

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "MFA enrollment failed" }, { status: 400 });
    }

    return NextResponse.json({
      factorId: data.id,
      qrCode: data.totp?.qr_code,
      secret: data.totp?.secret,
      uri: data.totp?.uri,
    });
  } catch (err) {
    return NextResponse.json({ error: toSafeApiError(err, "MFA enrollment failed") }, { status: 500 });
  }
}
