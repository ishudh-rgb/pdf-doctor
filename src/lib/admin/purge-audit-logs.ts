import { createServiceClient } from "@/lib/supabase/server";
import { logError } from "@/lib/db/queries";
import { ADMIN_AUDIT_RETENTION_DAYS } from "@/lib/admin/audit-retention";

/** Delete admin audit logs older than retention policy (default 90 days). */
export async function purgeOldAdminAuditLogs(
  retentionDays = ADMIN_AUDIT_RETENTION_DAYS
): Promise<number> {
  try {
    const supabase = await createServiceClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const { data, error } = await supabase
      .from("admin_audit_logs")
      .delete()
      .lt("created_at", cutoff.toISOString())
      .select("id");

    if (error) throw error;
    return data?.length ?? 0;
  } catch (err) {
    await logError({
      tool_name: "cleanup",
      error_type: "ADMIN_AUDIT_PURGE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}
