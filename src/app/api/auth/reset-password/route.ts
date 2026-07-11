import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  isLocalDevAuthEnabled,
  localDevResetPasswordWithToken,
} from "@/lib/auth/local-dev-auth";
import { checkPasswordResetRateLimit, rateLimitResponse } from "@/lib/server/rate-limiter";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { jsonApiError, jsonApiMessage } from "@/lib/server/api-error";
import { isPasswordRecoverySession } from "@/lib/auth/recovery-session";

export async function POST(request: NextRequest) {
  try {
    const originBlocked = guardMutationOrigin(request);
    if (originBlocked) return originBlocked;

    const rate = await checkPasswordResetRateLimit(request);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec, request, "password-reset");

    const { token, password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (isLocalDevAuthEnabled()) {
      if (!token) {
        return NextResponse.json(
          { error: "Reset token is required" },
          { status: 400 }
        );
      }

      await localDevResetPasswordWithToken({ token, password });

      return NextResponse.json({
        message: "Password updated successfully. You can now log in.",
      });
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
    const recoverySession = await isPasswordRecoverySession(supabase);
    if (!recoverySession) {
      return jsonApiMessage(
        request,
        "Open the reset link from your email to continue, or request a new one.",
        403
      );
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return jsonApiError(request, error, 400, "Could not reset password");
    }

    await supabase.auth.signOut({ scope: "global" });

    return NextResponse.json({
      message: "Password updated successfully. You can now log in.",
    });
  } catch (err) {
    return jsonApiError(request, err, 400, "Could not reset password");
  }
}
