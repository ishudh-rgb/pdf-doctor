import { NextRequest, NextResponse } from "next/server";
import { tryGetApiUser } from "@/lib/auth/get-api-user";
import {
  getLocalDevSessionUser,
  isLocalDevAuthEnabled,
} from "@/lib/auth/local-dev-auth";
import { getUserProfile } from "@/lib/db/queries";
import { guardGeneralApiRateLimit } from "@/lib/server/rate-limiter";

export async function GET(request: NextRequest) {
  const rateLimited = await guardGeneralApiRateLimit(request);
  if (rateLimited) return rateLimited;

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

    const auth = await tryGetApiUser({ skipMfaAssurance: true });
    if (!auth.ok) return auth.response;

    let profile = null;
    try {
      profile = await getUserProfile(auth.user.id);
    } catch {
      // Profile may not exist yet for new users
    }

    return NextResponse.json({
      user: {
        id: auth.user.id,
        email: auth.user.email,
        role: profile?.role ?? "user",
        plan: profile?.plan ?? auth.user.plan,
        full_name: profile?.full_name ?? null,
      },
    });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
