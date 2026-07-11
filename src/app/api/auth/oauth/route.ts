import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { APP_URL } from "@/config/constants";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { checkAuthRateLimit, rateLimitResponse } from "@/lib/server/rate-limiter";
import { toSafeApiError } from "@/lib/server/safe-error";

const ALLOWED_PROVIDERS = ["google", "github", "azure"] as const;
type OAuthProvider = (typeof ALLOWED_PROVIDERS)[number];

function isAllowedProvider(value: string): value is OAuthProvider {
  return (ALLOWED_PROVIDERS as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  try {
    const originBlocked = guardMutationOrigin(request);
    if (originBlocked) return originBlocked;

    const rate = await checkAuthRateLimit(request);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Sign-in with Google/GitHub requires Supabase to be configured." },
        { status: 503 }
      );
    }

    const { provider, redirectTo } = (await request.json()) as {
      provider?: string;
      redirectTo?: string;
    };

    if (!provider || !isAllowedProvider(provider)) {
      return NextResponse.json({ error: "Invalid OAuth provider" }, { status: 400 });
    }

    const appUrl = APP_URL.replace(/\/$/, "");
    const callbackUrl = `${appUrl}/auth/callback${
      redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""
    }`;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return NextResponse.json(
        { error: error?.message ?? "Could not start OAuth sign-in" },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    return NextResponse.json(
      { error: toSafeApiError(err, "OAuth sign-in failed") },
      { status: 500 }
    );
  }
}
