import { NextRequest, NextResponse } from "next/server";
import { tryGetApiUser } from "@/lib/auth/get-api-user";
import { guardGeneralApiRateLimit } from "@/lib/server/rate-limiter";
import { getOrganizationById } from "@/lib/enterprise/organizations.service";
import { captureApiError } from "@/lib/server/safe-error";

export async function GET(request: NextRequest) {
  try {
    const rate = await guardGeneralApiRateLimit(request);
    if (rate) return rate;

    const auth = await tryGetApiUser();
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const organizationId = request.nextUrl.searchParams.get("organizationId");
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    const org = await getOrganizationById(organizationId, user.id);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    captureApiError(error, { route: "enterprise/organizations/detail", method: "GET" });
    return NextResponse.json({ error: "Failed to load organization" }, { status: 500 });
  }
}
