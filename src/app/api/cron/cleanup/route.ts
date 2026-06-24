import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredFiles } from "@/lib/services/cleanup.service";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized = authHeader === `Bearer ${cronSecret}`;

    if (!cronSecret || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await cleanupExpiredFiles();

    return NextResponse.json({
      deleted: result.deleted,
      failed: result.failed,
      cleaned_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cleanup cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
