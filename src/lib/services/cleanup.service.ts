import { createServiceClient } from "@/lib/supabase/server";
import { getExpiredFiles, markFileDeleted, logError, purgeOldConsentRecords, purgeOldUsageLogs as purgeOldUsageLogsFromDb, purgeOldAiUsageLogs as purgeOldAiUsageLogsFromDb, purgeOldErrorLogs as purgeOldErrorLogsFromDb } from "@/lib/db/queries";

const STORAGE_BUCKET = "pdf-files";
const BATCH_SIZE = 200;
const STORAGE_DELETE_CHUNK = 20;

export async function cleanupExpiredFiles(): Promise<{
  deleted: number;
  failed: number;
  batches: number;
}> {
  let deleted = 0;
  let failed = 0;
  let batches = 0;

  try {
    const supabase = await createServiceClient();

    while (true) {
      const expiredFiles = await getExpiredFiles(BATCH_SIZE);
      if (expiredFiles.length === 0) break;

      batches += 1;

      for (let i = 0; i < expiredFiles.length; i += STORAGE_DELETE_CHUNK) {
        const chunk = expiredFiles.slice(i, i + STORAGE_DELETE_CHUNK);
        const paths = chunk.map((f) => f.storage_path);

        try {
          const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
          if (error) {
            failed += chunk.length;
            continue;
          }

          await Promise.all(chunk.map((file) => markFileDeleted(file.id)));
          deleted += chunk.length;
        } catch (err) {
          failed += chunk.length;
          await logError({
            tool_name: "cleanup",
            error_type: "FILE_CLEANUP_CHUNK_FAILED",
            error_message: err instanceof Error ? err.message : String(err),
            metadata: { paths },
          });
        }
      }

      if (expiredFiles.length < BATCH_SIZE) break;
    }
  } catch (err) {
    await logError({
      tool_name: "cleanup",
      error_type: "CLEANUP_BATCH_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
  }

  return { deleted, failed, batches };
}

export async function purgeExpiredConsentRecords(): Promise<number> {
  try {
    return await purgeOldConsentRecords(3);
  } catch (err) {
    await logError({
      tool_name: "cleanup",
      error_type: "CONSENT_PURGE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

export async function purgeOldUsageLogs(): Promise<number> {
  try {
    return await purgeOldUsageLogsFromDb(90);
  } catch (err) {
    await logError({
      tool_name: "cleanup",
      error_type: "USAGE_LOG_PURGE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

export async function purgeOldAiUsageLogs(): Promise<number> {
  try {
    return await purgeOldAiUsageLogsFromDb(90);
  } catch (err) {
    await logError({
      tool_name: "cleanup",
      error_type: "AI_USAGE_LOG_PURGE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

export async function purgeOldErrorLogs(): Promise<number> {
  try {
    return await purgeOldErrorLogsFromDb(90);
  } catch (err) {
    await logError({
      tool_name: "cleanup",
      error_type: "ERROR_LOG_PURGE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

export async function getCleanupStats(): Promise<{
  pendingCleanup: number;
  totalDeleted: number;
}> {
  try {
    const supabase = await createServiceClient();

    const [{ count: pendingCleanup }, { count: totalDeleted }] =
      await Promise.all([
        supabase
          .from("uploaded_files")
          .select("id", { count: "exact", head: true })
          .eq("is_deleted", false)
          .lt("expires_at", new Date().toISOString()),
        supabase
          .from("uploaded_files")
          .select("id", { count: "exact", head: true })
          .eq("is_deleted", true),
      ]);

    return {
      pendingCleanup: pendingCleanup ?? 0,
      totalDeleted: totalDeleted ?? 0,
    };
  } catch (err) {
    await logError({
      tool_name: "cleanup",
      error_type: "CLEANUP_STATS_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return { pendingCleanup: 0, totalDeleted: 0 };
  }
}
