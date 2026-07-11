import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { APP_URL } from "@/config/constants";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { checkAuthRateLimit, rateLimitResponse } from "@/lib/server/rate-limiter";
import { toSafeApiError } from "@/lib/server/safe-error";

function normalizeDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.includes("@")) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  const domain = withoutProtocol.split(":")[0] ?? "";
  if (!domain.includes(".") || domain.length < 4) return null;
  return domain;
}

export async function POST(request: NextRequest) {
  try {
    const originBlocked = guardMutationOrigin(request);
    if (originBlocked) return originBlocked;

    const rate = await checkAuthRateLimit(request);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Enterprise SSO requires Supabase to be configured." },
        { status: 503 }
      );
    }

    const { domain: rawDomain, redirectTo } = (await request.json()) as {
      domain?: string;
      redirectTo?: string;
    };

    const domain = rawDomain ? normalizeDomain(rawDomain) : null;
    if (!domain) {
      return NextResponse.json({ error: "Enter a valid company email domain." }, { status: 400 });
    }

    const appUrl = APP_URL.replace(/\/$/, "");
    const callbackUrl = `${appUrl}/auth/callback${
      redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""
    }`;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithSSO({
      domain,
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error || !data?.url) {
      return NextResponse.json(
        { error: error?.message ?? "SSO is not configured for this domain." },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    return NextResponse.json(
      { error: toSafeApiError(err, "Enterprise SSO sign-in failed") },
      { status: 500 }
    );
  }
}
