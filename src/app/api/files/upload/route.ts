import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { uploadFile, validateFile } from "@/lib/services/upload.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { createUploadedFileRecord } from "@/lib/db/queries";
import { tryGetApiUser } from "@/lib/auth/get-api-user";
import { getGuestSessionIdFromRequest } from "@/lib/privacy/guest-session";
import { getGuestUsageKey } from "@/lib/server/client-ip";
import { generateSecureFilename } from "@/lib/utils/file";
import { validateBufferMagic } from "@/lib/utils/file-magic";
import { FILE_LIMITS } from "@/config/constants";
import { guardMaintenanceMode } from "@/lib/server/tool-request-guards";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { authGuardResponse } from "@/lib/server/auth-guard-http";
import { toSafeApiError, captureApiError } from "@/lib/server/safe-error";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const originBlocked = guardMutationOrigin(request);
  if (originBlocked) return originBlocked;

  const maintenance = await guardMaintenanceMode(request);
  if (maintenance) return maintenance;

  const rateLimited = await guardToolRateLimit(request, "file-upload");
  if (rateLimited) return rateLimited;

  let userId: string | null = null;

  try {
    const auth = await tryGetApiUser();
    if (auth.ok) {
      userId = auth.user.id;
    } else if (auth.response.status !== 401) {
      return auth.response;
    }

    const sizeResult = userId
      ? await checkFileSizeLimit(userId)
      : { maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
    const maxSizeMB = sizeResult.maxSizeMB;

    const sessionId = userId ? null : getGuestSessionIdFromRequest(request);

    const usageResult = await checkUsageLimit(userId, getGuestUsageKey(request), "file-upload");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const ALLOWED_UPLOAD_TYPES = [
      "application/pdf",
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/html", "text/plain",
    ];
    const validation = validateFile(file, maxSizeMB, ALLOWED_UPLOAD_TYPES);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const secureName = generateSecureFilename(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const magic = validateBufferMagic(buffer, ["pdf", "word", "image", "excel", "powerpoint", "html", "txt"]);
    if (!magic.valid) {
      return NextResponse.json({ error: magic.message ?? "Invalid file content." }, { status: 400 });
    }

    const uploadResult = await uploadFile(buffer, secureName, file.type, userId);

    const record = await createUploadedFileRecord({
      original_name: file.name,
      stored_name: uploadResult.storedName,
      storage_path: uploadResult.storagePath,
      mime_type: file.type,
      file_size_bytes: file.size,
      user_id: userId,
      guest_session_id: userId ? null : sessionId,
    });

    return NextResponse.json({
      id: record.id,
      name: secureName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    const blocked = authGuardResponse(error);
    if (blocked) return blocked;

    const message = toSafeApiError(error, "Failed to upload file");
    captureApiError(error, { route: "files/upload", user_id: userId });

    if (error instanceof Error && (error.message.includes("usage limit") || error.message.includes("limit reached"))) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
