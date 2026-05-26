import { createServiceClient } from "@/lib/supabase/server";
import { getExpiredFiles, markFileDeleted, logError } from "@/lib/db/queries";

const STORAGE_BUCKET = "pdf-files";

export async function cleanupExpiredFiles(): Promise<{
  deleted: number;
  failed: number;
}> {
  let deleted = 0;
  let failed = 0;

  try {
    const expiredFiles = await getExpiredFiles();

    if (expiredFiles.length === 0) {
      return { deleted: 0, failed: 0 };
    }

    const supabase = await createServiceClient();

    for (const file of expiredFiles) {
      try {
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([file.storage_path]);

        if (error) {
          console.error(
            `Failed to delete file from storage: ${file.storage_path}`,
            error.message
          );
          failed++;
          continue;
        }

        await markFileDeleted(file.id);
        deleted++;
      } catch (err) {
        failed++;
        await logError({
          tool_name: "cleanup",
          error_type: "FILE_CLEANUP_FAILED",
          error_message: err instanceof Error ? err.message : String(err),
          metadata: { file_id: file.id, storage_path: file.storage_path },
        });
      }
    }
  } catch (err) {
    await logError({
      tool_name: "cleanup",
      error_type: "CLEANUP_BATCH_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
  }

  return { deleted, failed };
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
