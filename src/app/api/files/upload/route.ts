import { NextRequest, NextResponse } from "next/server";
import { uploadFile, validateFile } from "@/lib/services/upload.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { createUploadedFileRecord, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { generateSecureFilename } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const isPro = user ? await checkFileSizeLimit(user.id) : false;
    const maxSizeMB = isPro ? FILE_LIMITS.maxProFileSizeMB : FILE_LIMITS.maxFreeFileSizeMB;

    await checkUsageLimit(userId, request.headers.get("x-forwarded-for"));

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const validation = validateFile(file, maxSizeMB, []);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const secureName = generateSecureFilename(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await uploadFile(buffer, secureName, file.type, userId);

    const record = await createUploadedFileRecord({
      original_name: file.name,
      stored_name: uploadResult.storedName,
      storage_path: uploadResult.storagePath,
      mime_type: file.type,
      file_size_bytes: file.size,
      user_id: userId,
    });

    return NextResponse.json({
      id: record.id,
      name: secureName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      storagePath: uploadResult.storagePath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload file";

    await logError({
      user_id: userId,
      tool_name: "file-upload",
      error_type: "UPLOAD_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
