import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  isLocalDevAuthEnabled,
  localDevResetPasswordWithToken,
} from "@/lib/auth/local-dev-auth";

export async function POST(request: NextRequest) {
  try {
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
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Password updated successfully. You can now log in.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Reset password error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
