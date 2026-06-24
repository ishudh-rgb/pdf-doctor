import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { txtFileToPdf } from "@/lib/services/txt-to-pdf.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { validateFileSize, sanitizeFilename } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 60;

const ALLOWED_EXTENSIONS = ["txt", "text", "log", "csv", "md", "json", "xml", "yaml", "yml", "ini", "cfg", "conf", "env"];

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export async function POST(request: NextRequest) {
  const rateLimited = await guardToolRateLimit(request, "txt-to-pdf");
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

    const usageResult = await checkUsageLimit(userId, request, "txt-to-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pageSize = (formData.get("pageSize") as string) || "a4";
    const orientation = (formData.get("orientation") as string) || "portrait";
    const margin = (formData.get("margin") as string) || "small";
    const fontSize = parseInt(formData.get("fontSize") as string, 10) || 11;
    const fontFamily = (formData.get("fontFamily") as string) || "helvetica";

    if (!file) {
      return NextResponse.json({ error: "Text file is required" }, { status: 400 });
    }

    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Only TXT, LOG, CSV, MD, JSON, XML, YAML, INI, and other text files are accepted." },
        { status: 400 }
      );
    }

    const sizeCheck = validateFileSize(file, maxSizeMB);
    if (!sizeCheck.valid) {
      return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfBuffer = await txtFileToPdf(buffer, file.name, {
      pageSize: pageSize as "a4" | "letter",
      orientation: orientation as "portrait" | "landscape",
      margin: margin as "none" | "small" | "medium",
      fontSize,
      fontFamily: fontFamily as "courier" | "helvetica" | "times",
    });

    const originalName = file.name.replace(/\.[^.]+$/i, "");

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "txt-to-pdf",
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
    const message = error instanceof Error ? error.message : "Failed to convert text to PDF";

    await logError({
      user_id: userId,
      tool_name: "txt-to-pdf",
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
