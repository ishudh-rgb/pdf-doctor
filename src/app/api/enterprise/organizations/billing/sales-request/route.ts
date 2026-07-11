import { NextRequest, NextResponse } from "next/server";
import { tryGetApiUser } from "@/lib/auth/get-api-user";
import { guardGeneralApiRateLimit } from "@/lib/server/rate-limiter";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { captureApiError } from "@/lib/server/safe-error";
import { sendTeamPlanSalesRequest } from "@/lib/enterprise/enterprise-sales";
import type { OrgBillingDuration } from "@/lib/enterprise/org-billing.service";

export async function POST(request: NextRequest) {
  try {
    const originBlocked = guardMutationOrigin(request);
    if (originBlocked) return originBlocked;

    const rate = await guardGeneralApiRateLimit(request);
    if (rate) return rate;

    const auth = await tryGetApiUser();
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { organizationId, duration, notes } = (await request.json()) as {
      organizationId?: string;
      duration?: OrgBillingDuration;
      notes?: string;
    };

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    const result = await sendTeamPlanSalesRequest({
      organizationId,
      requesterUserId: user.id,
      requesterEmail: user.email ?? "unknown@onlymypdf.in",
      duration: duration === "yearly" ? "yearly" : "monthly",
      notes: typeof notes === "string" ? notes : undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit team billing request";
    captureApiError(error, {
      route: "enterprise/organizations/billing/sales-request",
      method: "POST",
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
