import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { wordToPdf } from "@/lib/services/word-to-pdf.service";
import { withHeavyJobGuard } from "@/lib/server/conversion-semaphore";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize, sanitizeFilename } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rateLimited = await guardToolRateLimit(request, "word-to-pdf");
  if (rateLimited) return rateLimited;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const sizeResult = userId
      ? await checkFileSizeLimit(userId)
      : { maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
    const maxSizeMB = sizeResult.maxSizeMB;

    const usageResult = await checkUsageLimit(userId, request, "word-to-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Word document is required" },
        { status: 400 }
      );
    }

    if (!isValidFileType(file, ["word"])) {
      return NextResponse.json(
        { error: "Invalid file type. Only DOC/DOCX files are accepted." },
        { status: 400 }
      );
    }

    const sizeCheck = validateFileSize(file, maxSizeMB);
    if (!sizeCheck.valid) {
      return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfBuffer = await Promise.race([
      withHeavyJobGuard(() => wordToPdf(buffer)),
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "Conversion timed out. Try a smaller file, or retry in a moment."
              )
            ),
          55_000
        );
      }),
    ]);

    const originalName = file.name.replace(/\.(doc|docx)$/i, "");

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "word-to-pdf",
      ipAddress: clientIpForLogs(request),
      fileSize: buffer.length,
      processingTimeMs: processingTime,
      status: "completed",
    }).catch(() => {});

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(originalName)}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to convert Word to PDF";

    await logError({
      user_id: userId,
      tool_name: "word-to-pdf",
      error_type: "CONVERT_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
