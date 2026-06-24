import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  attachLocalDevSessionCookie,
  isLocalDevAuthEnabled,
  localDevSignUp,
} from "@/lib/auth/local-dev-auth";
import { checkAuthRateLimit, rateLimitResponse } from "@/lib/server/rate-limiter";
import { toSafeApiError } from "@/lib/server/safe-error";

export async function POST(request: NextRequest) {
  try {
    const rate = await checkAuthRateLimit(request);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (isLocalDevAuthEnabled()) {
      const user = await localDevSignUp({ email, password, fullName });
      const response = NextResponse.json({
        user,
        session: { mode: "local-dev" },
        needsEmailConfirmation: false,
        message: "Account created successfully (local development mode).",
      });
      return attachLocalDevSessionCookie(response, user.id);
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Signup is not available yet. Add your Supabase URL and anon key in .env.local, then restart the server.",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || "" },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
      needsEmailConfirmation: !data.session,
      message: data.session
        ? "Account created successfully"
        : "Account created. Please check your email to confirm your account.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Signup error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
