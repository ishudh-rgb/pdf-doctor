import { NextRequest, NextResponse } from "next/server";
import { pdfToWord } from "@/lib/services/pdf-to-word.service";
import {
  completePdfToWordJob,
  createPdfToWordJob,
  failPdfToWordJob,
  updatePdfToWordJobProgress,
} from "@/lib/services/pdf-to-word-jobs.service";
import { checkUsageLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError, getUserProfile } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize, sanitizeFilename } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const maxDuration = 600;

function wantsJobMode(request: NextRequest): boolean {
  return request.headers.get("x-pdf-to-word-job") === "1";
}

async function runConversionJob(
  jobId: string,
  buffer: Buffer,
  fileName: string,
  originalName: string,
  meta: {
    userId: string | null;
    sessionId: string;
    ipAddress: string | null;
    startTime: number;
  }
) {
  try {
    const result = await pdfToWord(buffer, {
      fileName,
      onProgress: (percent) => updatePdfToWordJobProgress(jobId, percent),
    });

    completePdfToWordJob(jobId, result);

    void logToolUsage({
      userId: meta.userId,
      sessionId: meta.sessionId,
      toolSlug: "pdf-to-word",
      ipAddress: meta.ipAddress,
      fileSize: buffer.length,
      processingTimeMs: Date.now() - meta.startTime,
      status: "completed",
    }).catch(() => {});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to convert PDF to Word";
    failPdfToWordJob(jobId, message);
    await logError({
      user_id: meta.userId,
      tool_name: "pdf-to-word",
      error_type: "CONVERT_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const isPro = user ? (await getUserProfile(user.id)).plan === "pro" : false;
    const maxSizeMB = isPro ? FILE_LIMITS.maxProFileSizeMB : FILE_LIMITS.maxFreeFileSizeMB;

    const usage = await checkUsageLimit(userId, request.headers.get("x-forwarded-for"));
    if (!usage.allowed) {
      return NextResponse.json(
        { error: usage.message || "Daily usage limit reached." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name.replace(/\.pdf$/i, "");
    const outputFilename = `${sanitizeFilename(originalName)}.docx`;

    if (wantsJobMode(request)) {
      const jobId = createPdfToWordJob(outputFilename);
      void runConversionJob(jobId, buffer, file.name, originalName, {
        userId,
        sessionId: request.headers.get("x-session-id") || "anonymous",
        ipAddress: request.headers.get("x-forwarded-for"),
        startTime,
      });
      return NextResponse.json({ jobId });
    }

    const { buffer: docxBuffer, engine } = await pdfToWord(buffer, {
      fileName: file.name,
    });

    void logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "pdf-to-word",
      ipAddress: request.headers.get("x-forwarded-for"),
      fileSize: buffer.length,
      processingTimeMs: Date.now() - startTime,
      status: "completed",
    }).catch(() => {});

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${outputFilename}"`,
        "Content-Length": String(docxBuffer.length),
        "X-Pdf-Engine": engine,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to convert PDF to Word";

    await logError({
      user_id: userId,
      tool_name: "pdf-to-word",
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
