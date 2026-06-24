import { NextRequest, NextResponse } from "next/server";
import { CONSENT_VERSION } from "@/lib/privacy/consent";
import { getGuestSessionIdFromRequest } from "@/lib/privacy/guest-session";
import { logConsentRecord } from "@/lib/db/queries";
import { getGuestUsageKey } from "@/lib/server/client-ip";
import { guardGeneralApiRateLimit } from "@/lib/server/rate-limiter";
import { getApiUser } from "@/lib/auth/get-api-user";

export async function POST(request: NextRequest) {
  const rateLimited = await guardGeneralApiRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const body = (await request.json()) as {
      analytics?: boolean;
      marketing?: boolean;
      consent_version?: string;
    };

    const user = await getApiUser();

    await logConsentRecord({
      user_id: user?.id ?? null,
      guest_session_id: getGuestSessionIdFromRequest(request),
      consent_version: body.consent_version ?? CONSENT_VERSION,
      essential: true,
      analytics: Boolean(body.analytics),
      marketing: Boolean(body.marketing),
      ip_hash: getGuestUsageKey(request),
      user_agent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record consent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
