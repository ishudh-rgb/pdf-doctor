import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/db/queries";
import {
  getLocalDevSessionUser,
  isLocalDevAuthEnabled,
} from "@/lib/auth/local-dev-auth";

export async function GET() {
  try {
    if (isLocalDevAuthEnabled()) {
      const user = await getLocalDevSessionUser();
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          plan: user.plan,
          full_name: user.full_name,
        },
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let profile = null;
    try {
      profile = await getUserProfile(user.id);
    } catch {
      // Profile may not exist yet for new users
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role ?? "user",
        plan: profile?.plan ?? "free",
        full_name: profile?.full_name ?? null,
      },
    });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
