import { createServiceClient } from "@/lib/supabase/server";
import { createUploadedFile, logError } from "@/lib/db/queries";
import { generateSecureFilename } from "@/lib/utils/file";

const STORAGE_BUCKET = "pdf-files";

export interface UploadResult {
  fileId: string;
  storagePath: string;
  storedName: string;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface FileValidation {
  valid: boolean;
  message: string;
}

export function validateFile(
  file: { name: string; size: number; type: string },
  maxSizeMB: number,
  allowedTypes: string[]
): FileValidation {
  if (file.size === 0) {
    return { valid: false, message: "File is empty." };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `File size exceeds the maximum allowed size of ${maxSizeMB} MB.`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: `File type "${file.type}" is not allowed. Accepted types: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true, message: "" };
}

export async function uploadFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  userId?: string | null,
  guestSessionId?: string | null
): Promise<UploadResult> {
  try {
    const supabase = await createServiceClient();
    const storedName = generateSecureFilename(originalName);
    const storagePath = userId
      ? `users/${userId}/${storedName}`
      : `guests/${guestSessionId ?? "anonymous"}/${storedName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const fileRecord = await createUploadedFile({
      user_id: userId ?? null,
      guest_session_id: guestSessionId ?? null,
      original_name: originalName,
      stored_name: storedName,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size_bytes: fileBuffer.length,
      file_type: "input",
    });

    return {
      fileId: fileRecord.id,
      storagePath,
      storedName,
      originalName,
      mimeType,
      fileSizeBytes: fileBuffer.length,
    };
  } catch (err) {
    await logError({
      user_id: userId,
      tool_name: "upload",
      error_type: "UPLOAD_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}

export async function deleteFile(storagePath: string): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) throw error;
  } catch (err) {
    await logError({
      tool_name: "upload",
      error_type: "DELETE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function getFileUrl(storagePath: string): Promise<string> {
  const supabase = await createServiceClient();
  const { data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 2); // 2-hour expiry

  if (!data?.signedUrl) {
    throw new Error(`Failed to generate signed URL for ${storagePath}`);
  }

  return data.signedUrl;
}
