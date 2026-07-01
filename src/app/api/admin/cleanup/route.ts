import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { cleanupExpiredFiles, getCleanupStats } from "@/lib/services/cleanup.service";
import { logAdminAction } from "@/lib/admin/audit-log";
import { getGuestUsageKey } from "@/lib/server/client-ip";
import { toSafeApiError } from "@/lib/server/safe-error";

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const [stats, { count, error }] = await Promise.all([
      getCleanupStats(),
      serviceClient
        .from("uploaded_files")
        .select("id", { count: "exact", head: true })
        .eq("is_deleted", false)
        .lt("expires_at", new Date().toISOString()),
    ]);

    if (error) throw error;

    const pending = count ?? 0;

    return NextResponse.json({
      expired_files_count: pending,
      pendingFiles: pending,
      totalDeleted: stats.totalDeleted,
      totalStorageUsed: `${stats.totalDeleted} files marked deleted`,
      checked_at: new Date().toISOString(),
      lastCleanup: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch cleanup stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const originBlocked = guardMutationOrigin(request);
    if (originBlocked) return originBlocked;

    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await cleanupExpiredFiles();

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email ?? "admin",
      action: "cleanup.run",
      targetType: "storage",
      payload: result,
      ipHash: getGuestUsageKey(request),
    });

    return NextResponse.json({
      cleaned: result.deleted,
      cleanedCount: result.deleted,
      failed: result.failed,
      batches: result.batches,
      cleaned_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = toSafeApiError(err, "Cleanup failed");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
