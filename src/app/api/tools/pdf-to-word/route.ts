import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { pdfToWord, mapPdfToWordError } from "@/lib/services/pdf-to-word.service";
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
import { clientIpForLogs } from "@/lib/server/request-security";
import { resolvePdfBuffer } from "@/lib/pdf/pdf-password.server";
import { withHeavyJobGuard } from "@/lib/server/conversion-semaphore";
import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { getGuestUsageKey } from "@/lib/server/client-ip";
import { resolveJobOwnerKey } from "@/lib/server/job-owner";

export const maxDuration = 600;

function wantsJobMode(request: NextRequest): boolean {
  return request.headers.get("x-pdf-to-word-job") === "1";
}

function parsePassword(formData: FormData): string | undefined {
  const raw = formData.get("options");
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw) as { password?: unknown };
    return typeof parsed.password === "string" && parsed.password.length > 0
      ? parsed.password
      : undefined;
  } catch {
    return undefined;
  }
}

function passwordErrorResponse(message: string) {
  const mapped = mapPdfToWordError(message);
  if (mapped === "PASSWORD_REQUIRED") {
    return NextResponse.json(
      {
        error: "This PDF is password-protected. Enter the password to convert.",
        code: "PASSWORD_REQUIRED",
      },
      { status: 422 }
    );
  }
  if (mapped === "WRONG_PASSWORD") {
    return NextResponse.json(
      { error: "Incorrect password. Please try again.", code: "WRONG_PASSWORD" },
      { status: 422 }
    );
  }
  return null;
}

async function preparePdfInput(
  buffer: Buffer,
  password?: string
): Promise<Buffer> {
  return await resolvePdfBuffer(buffer, password);
}

async function runConversionJob(
  jobId: string,
  inputPath: string,
  workDir: string,
  outputPath: string,
  fileName: string,
  meta: {
    userId: string | null;
    sessionId: string;
    ipAddress: string | null;
    startTime: number;
    fileSize: number;
    pdfPassword?: string;
  }
) {
  try {
    const inputStat = await fs.stat(inputPath);
    const result = await withHeavyJobGuard(() =>
      pdfToWord({
        fileName,
        inputPath,
        outputPath,
        pdfPassword: meta.pdfPassword,
        onProgress: (percent) => updatePdfToWordJobProgress(jobId, percent),
      })
    );

    completePdfToWordJob(jobId, {
      outputPath: result.outputPath ?? outputPath,
      workDir,
      engine: result.engine,
    });

    void logToolUsage({
      userId: meta.userId,
      sessionId: meta.sessionId,
      toolSlug: "pdf-to-word",
      ipAddress: meta.ipAddress,
      fileSize: inputStat.size,
      processingTimeMs: Date.now() - meta.startTime,
      status: "completed",
    }).catch(() => {});
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Failed to convert PDF to Word";
    const message = mapPdfToWordError(raw);
    failPdfToWordJob(jobId, message, workDir);
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
    const toolRate = await guardToolRateLimit(request, "pdf-to-word");
    if (toolRate) return toolRate;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const isPro = user ? (await getUserProfile(user.id)).plan === "pro" : false;
    const maxSizeMB = isPro ? FILE_LIMITS.maxProFileSizeMB : FILE_LIMITS.maxFreeFileSizeMB;

    const usage = await checkUsageLimit(userId, getGuestUsageKey(request));
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
    const pdfPassword = parsePassword(formData);

    let prepared: Buffer;
    try {
      prepared = await preparePdfInput(buffer, pdfPassword);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const passwordResponse = passwordErrorResponse(message);
      if (passwordResponse) return passwordResponse;
      throw err;
    }

    if (wantsJobMode(request)) {
      const ownerKey = resolveJobOwnerKey(request, userId);
      const jobId = createPdfToWordJob(outputFilename, ownerKey);
      const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdfdoctor-ptw-job-"));
      const inputPath = path.join(workDir, "input.pdf");
      const outputPath = path.join(workDir, outputFilename);
      await fs.writeFile(inputPath, prepared);

      void runConversionJob(jobId, inputPath, workDir, outputPath, file.name, {
        userId,
        sessionId: request.headers.get("x-session-id") || "anonymous",
        ipAddress: getGuestUsageKey(request),
        startTime,
        fileSize: prepared.length,
        pdfPassword,
      });
      return NextResponse.json({ jobId });
    }

    const { buffer: docxBuffer, engine } = await withHeavyJobGuard(() =>
      pdfToWord({
        buffer: prepared,
        fileName: file.name,
        pdfPassword,
      })
    );

    if (!docxBuffer) {
      throw new Error("Conversion failed to produce a Word file");
    }

    void logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "pdf-to-word",
      ipAddress: clientIpForLogs(request),
      fileSize: prepared.length,
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
    const raw = error instanceof Error ? error.message : "Failed to convert PDF to Word";
    const message = mapPdfToWordError(raw);

    await logError({
      user_id: userId,
      tool_name: "pdf-to-word",
      error_type: "CONVERT_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message === "PASSWORD_REQUIRED") {
      return NextResponse.json(
        {
          error: "This PDF is password-protected. Enter the password to convert.",
          code: "PASSWORD_REQUIRED",
        },
        { status: 422 }
      );
    }
    if (message === "WRONG_PASSWORD") {
      return NextResponse.json(
        { error: "Incorrect password. Please try again.", code: "WRONG_PASSWORD" },
        { status: 422 }
      );
    }

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
