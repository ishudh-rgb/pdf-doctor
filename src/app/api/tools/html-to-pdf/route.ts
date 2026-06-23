import { NextRequest, NextResponse } from "next/server";
import { htmlFileToPdf } from "@/lib/services/html-to-pdf-convert.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { validateFileSize, sanitizeFilename } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { createPdfSession, buildOwnerHash } from "@/lib/pdf/pdf-session-store";
import { probePdfAccess } from "@/lib/pdf/pdf-password.server";
import { withHeavyJobGuard } from "@/lib/server/conversion-semaphore";

export const maxDuration = 300;

const ALLOWED_EXTENSIONS = ["html", "htm", "xhtml", "mhtml", "svg"];

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export async function POST(request: NextRequest) {
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

    const usageResult = await checkUsageLimit(userId, request.headers.get("x-forwarded-for"), "html-to-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pageSize = (formData.get("pageSize") as string) || "a4";
    const orientation = (formData.get("orientation") as string) || "portrait";
    const margin = (formData.get("margin") as string) || "small";

    if (!file) {
      return NextResponse.json(
        { error: "HTML file is required" },
        { status: 400 }
      );
    }

    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Only HTML, HTM, XHTML, MHTML, and SVG files are accepted." },
        { status: 400 }
      );
    }

    const sizeCheck = validateFileSize(file, maxSizeMB);
    if (!sizeCheck.valid) {
      return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfBuffer = await withHeavyJobGuard(() =>
      htmlFileToPdf(buffer, file.name, {
        pageSize: pageSize as "a4" | "letter" | "auto",
        orientation: orientation as "portrait" | "landscape",
        margin: margin as "none" | "small" | "medium",
      })
    );

    const originalName = file.name.replace(/\.(html?|xhtml|mhtml|svg)$/i, "");

    const ownerHash = buildOwnerHash(userId, request.headers.get("x-forwarded-for"));
    const probe = await probePdfAccess(pdfBuffer);
    const totalPages = probe.status === "ok" ? probe.pages : 0;
    const previewSessionId = await createPdfSession(pdfBuffer, ownerHash);

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "html-to-pdf",
      ipAddress: request.headers.get("x-forwarded-for"),
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
        "X-Pdf-Session-Id": previewSessionId,
        "X-Pdf-Total-Pages": String(totalPages),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to convert HTML to PDF";

    await logError({
      user_id: userId,
      tool_name: "html-to-pdf",
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
