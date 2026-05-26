import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  attachLocalDevSessionCookie,
  isLocalDevAuthEnabled,
  localDevSignIn,
} from "@/lib/auth/local-dev-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (isLocalDevAuthEnabled()) {
      const user = await localDevSignIn({ email, password });
      const response = NextResponse.json({
        user,
        session: { mode: "local-dev" },
      });
      return attachLocalDevSessionCookie(response, user.id);
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Login is not available yet. Add your Supabase URL and anon key in .env.local, then restart the server.",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ user: data.user, session: data.session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Login error:", err);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
