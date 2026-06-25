import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  createToolJob,
  updateToolJob,
  createUploadedFile,
  getUserProfile,
  updateUserProfile,
} from "@/lib/db/queries";
import { generateSecureFilename } from "@/lib/utils/file";

const STORAGE_BUCKET = "pdf-files";

export async function persistCompletedToolJob(data: {
  userId: string;
  toolName: string;
  inputFileNames?: string[];
  outputBuffer: Buffer;
  outputFileName: string;
  mimeType: string;
  processingTimeMs?: number;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const inputFiles = (data.inputFileNames ?? []).map((name) => ({ name }));

    const job = await createToolJob({
      user_id: data.userId,
      tool_name: data.toolName,
      input_files: inputFiles,
      file_size_bytes: data.outputBuffer.length,
    });

    const supabase = await createServiceClient();
    const storedName = generateSecureFilename(data.outputFileName);
    const storagePath = `users/${data.userId}/outputs/${storedName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, data.outputBuffer, {
        contentType: data.mimeType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    await createUploadedFile({
      user_id: data.userId,
      job_id: job.id,
      original_name: data.outputFileName,
      stored_name: storedName,
      storage_path: storagePath,
      mime_type: data.mimeType,
      file_size_bytes: data.outputBuffer.length,
      file_type: "output",
    });

    await updateToolJob(job.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      processing_time_ms: data.processingTimeMs ?? null,
      file_size_bytes: data.outputBuffer.length,
      output_file: { name: data.outputFileName, storagePath },
    });

    try {
      const profile = await getUserProfile(data.userId);
      const current =
        (profile as { total_files_processed?: number }).total_files_processed ?? 0;
      await updateUserProfile(data.userId, {
        total_files_processed: current + 1,
      });
    } catch {
      /* profile counter is best-effort */
    }
  } catch (err) {
    console.error("persistCompletedToolJob failed:", err);
  }
}
