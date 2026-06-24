import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  isLocalDevAuthEnabled,
  localDevCreateResetCode,
} from "@/lib/auth/local-dev-auth";
import { sendPasswordResetCode } from "@/lib/auth/password-reset-mailer";
import { checkAuthRateLimit, rateLimitResponse } from "@/lib/server/rate-limiter";
import { toSafeApiError } from "@/lib/server/safe-error";
import { APP_URL } from "@/config/constants";

export async function POST(request: NextRequest) {
  try {
    const rate = checkAuthRateLimit(request);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (isLocalDevAuthEnabled()) {
      const code = await localDevCreateResetCode(email);
      const delivery = await sendPasswordResetCode(email.trim().toLowerCase(), code);

      const body: Record<string, string> = {
        message: "Verification code sent to your email.",
        step: "verify-code",
        mode: "local-dev",
      };
      if (process.env.NODE_ENV === "development" && delivery.devCode) {
        body.devCode = delivery.devCode;
      }

      return NextResponse.json(body);
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Password reset is not available yet. Add your Supabase URL and anon key in .env.local, then restart the server.",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/reset-password`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "If an account exists for this email, a reset link has been sent.",
      step: "check-email",
      mode: "supabase",
    });
  } catch (err) {
    return NextResponse.json(
      { error: toSafeApiError(err, "Could not send reset email") },
      { status: 400 }
    );
  }
}
