import { NextRequest, NextResponse } from "next/server";
import { pdfToWord } from "@/lib/services/pdf-to-word.service";
import { checkUsageLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError, getUserProfile } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize, sanitizeFilename } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
    const { buffer: docxBuffer, engine } = await pdfToWord(buffer, {
      fileName: file.name,
    });

    const originalName = file.name.replace(/\.pdf$/i, "");

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "pdf-to-word",
      ipAddress: request.headers.get("x-forwarded-for"),
      fileSize: buffer.length,
      processingTimeMs: processingTime,
      status: "completed",
    }).catch(() => {});

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(originalName)}.docx"`,
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
