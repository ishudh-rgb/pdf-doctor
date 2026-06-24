import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredFiles, purgeExpiredConsentRecords } from "@/lib/services/cleanup.service";
import { isCronAuthorized } from "@/lib/ops/cron-auth";

export async function GET(request: NextRequest) {
  try {
    if (
      !isCronAuthorized(
        request.headers.get("authorization"),
        request.nextUrl.searchParams.get("secret"),
        request.headers.get("x-vercel-cron"),
        process.env.CRON_SECRET
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await cleanupExpiredFiles();
    const consentPurged = await purgeExpiredConsentRecords();

    return NextResponse.json({
      deleted: result.deleted,
      failed: result.failed,
      batches: result.batches,
      consent_records_purged: consentPurged,
      cleaned_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cleanup cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
