import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { compressPDF } from "@/lib/services/pdf-compress.service";
import { resolvePdfBuffer } from "@/lib/pdf/pdf-password.server";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { getToolRequestUserId } from "@/lib/auth/get-tool-request-user";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const rateLimited = await guardToolRateLimit(request, "compress-pdf");
  if (rateLimited) return rateLimited;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    userId = await getToolRequestUserId();

    const sizeResult = userId
      ? await checkFileSizeLimit(userId)
      : { maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
    const maxSizeMB = sizeResult.maxSizeMB;

    const usageResult = await checkUsageLimit(userId, request, "compress-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const level = (formData.get("level") as string) || "medium";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (!isValidFileType(file, ["pdf"])) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are accepted." },
        { status: 400 }
      );
    }

    const sizeCheck = validateFileSize(file, maxSizeMB);
    if (!sizeCheck.valid) {
      return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
    }

    if (!["basic", "strong"].includes(level)) {
      return NextResponse.json({ error: "Invalid compression level" }, { status: 400 });
    }

    const password = (formData.get("password") as string | null) || null;
    let buffer: Buffer;

    try {
      buffer = await resolvePdfBuffer(Buffer.from(await file.arrayBuffer()), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to open PDF";
      if (msg === "PASSWORD_REQUIRED") {
        return NextResponse.json(
          { error: "This PDF is password-protected. Enter the password to compress." },
          { status: 400 }
        );
      }
      if (msg === "WRONG_PASSWORD") {
        return NextResponse.json(
          { error: "Incorrect password. Please try again." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const originalSize = buffer.length;
    const result = await compressPDF(buffer, level as "basic" | "strong", password ?? undefined);
    const compressedSize = result.compressedSize;
    const savedPercent = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "compress-pdf",
      ipAddress: clientIpForLogs(request),
      fileSize: originalSize,
      processingTimeMs: processingTime,
      status: "completed",
      inputFileNames: [file.name],
      output: {
        buffer: result.buffer,
        fileName: "compressed.pdf",
        mimeType: "application/pdf",
      },
    }).catch(() => {});

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="compressed.pdf"',
        "Content-Length": String(compressedSize),
        "X-Original-Size": String(originalSize),
        "X-Compressed-Size": String(compressedSize),
        "X-Saved-Percent": String(savedPercent),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compress PDF";

    await logError({
      user_id: userId,
      tool_name: "compress-pdf",
      error_type: "COMPRESS_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
