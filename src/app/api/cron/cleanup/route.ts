import { NextRequest, NextResponse } from "next/server";
import {
  cleanupExpiredFiles,
  purgeExpiredConsentRecords,
  purgeOldUsageLogs,
  purgeOldAiUsageLogs,
  purgeOldErrorLogs,
} from "@/lib/services/cleanup.service";
import { isCronAuthorized } from "@/lib/ops/cron-auth";
import { captureApiError } from "@/lib/server/safe-error";

export async function GET(request: NextRequest) {
  try {
    if (
      !isCronAuthorized(
        request.headers.get("authorization"),
        request.headers.get("x-vercel-cron"),
        process.env.CRON_SECRET
      )
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await cleanupExpiredFiles();
    const consentPurged = await purgeExpiredConsentRecords();
    const usageLogsPurged = await purgeOldUsageLogs();
    const aiUsageLogsPurged = await purgeOldAiUsageLogs();
    const errorLogsPurged = await purgeOldErrorLogs();

    return NextResponse.json({
      deleted: result.deleted,
      failed: result.failed,
      batches: result.batches,
      consent_records_purged: consentPurged,
      usage_logs_purged: usageLogsPurged,
      ai_usage_logs_purged: aiUsageLogsPurged,
      error_logs_purged: errorLogsPurged,
      cleaned_at: new Date().toISOString(),
    });
  } catch (err) {
    captureApiError(err, { route: "cron/cleanup" });
    const message = err instanceof Error ? err.message : "Cleanup cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
