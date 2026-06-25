import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getLocalDevSessionUser,
  isLocalDevAuthEnabled,
} from "@/lib/auth/local-dev-auth";
import {
  getLocalDevDailyUsage,
  getLocalDevTotalProcessed,
  isLocalDevActivityEnabled,
} from "@/lib/auth/local-dev-activity";

export async function GET() {
  try {
    if (isLocalDevAuthEnabled()) {
      const user = await getLocalDevSessionUser();
      if (!user) {
        return NextResponse.json({ user: null, profile: null });
      }

      const [totalProcessed, aiUsedToday] = isLocalDevActivityEnabled()
        ? await Promise.all([
            getLocalDevTotalProcessed(user.id),
            getLocalDevDailyUsage(user.id, "ai-pdf-summarizer"),
          ])
        : [0, 0];

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        profile: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          plan: user.plan,
          plan_expires_at: null,
          total_files_processed: totalProcessed,
          ai_credits_used: aiUsedToday,
        },
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ user: null, profile: null });
    }

    const serviceClient = await createServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile || null,
    });
  } catch (err) {
    console.error("Session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
