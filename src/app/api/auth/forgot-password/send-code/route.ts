import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  isLocalDevAuthEnabled,
  localDevCreateResetCode,
} from "@/lib/auth/local-dev-auth";
import { sendPasswordResetCode } from "@/lib/auth/password-reset-mailer";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (isLocalDevAuthEnabled()) {
      const code = await localDevCreateResetCode(email);
      const delivery = await sendPasswordResetCode(email.trim().toLowerCase(), code);

      return NextResponse.json({
        message: "Verification code sent to your email.",
        step: "verify-code",
        mode: "local-dev",
        devCode: delivery.devCode,
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
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
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
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Send reset code error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
