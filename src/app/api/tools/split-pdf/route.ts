import { NextRequest, NextResponse } from "next/server";
import { splitPDF, splitAllPages, extractPages } from "@/lib/services/pdf-split.service";
import { buildPdfBuffersDownloadResponse } from "@/lib/pdf/pdf-buffers-response";
import { resolvePdfBuffer } from "@/lib/pdf/pdf-password.server";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const maxDuration = 60;

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

    const usageResult = await checkUsageLimit(userId, request.headers.get("x-forwarded-for"), "split-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) || "all";
    const ranges = formData.get("ranges") as string | null;
    const pages = formData.get("pages") as string | null;

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

    const password = (formData.get("password") as string | null) || null;
    let buffer: Buffer;

    try {
      buffer = await resolvePdfBuffer(Buffer.from(await file.arrayBuffer()), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to open PDF";
      if (msg === "PASSWORD_REQUIRED") {
        return NextResponse.json(
          { error: "This PDF is password-protected. Enter the password to continue." },
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

    let result: Buffer | Buffer[];
    let filename = "split.pdf";

    switch (mode) {
      case "all":
        result = await splitAllPages(buffer);
        break;
      case "range":
        if (!ranges) {
          return NextResponse.json(
            { error: "Ranges are required for range split mode (e.g., '1-3,5-7')" },
            { status: 400 }
          );
        }
        {
          const parsedRanges = ranges.split(",").map((r: string) => {
            const [start, end] = r.trim().split("-").map(Number);
            return { start, end: end ?? start };
          });
          result = await splitPDF(buffer, parsedRanges);
        }
        break;
      case "extract":
        if (!pages) {
          return NextResponse.json(
            { error: "Page numbers are required for extract mode (e.g., '1,3,5')" },
            { status: 400 }
          );
        }
        const pageNumbers = pages.split(",").map((p) => parseInt(p.trim(), 10));
        if (pageNumbers.some(isNaN)) {
          return NextResponse.json({ error: "Invalid page numbers" }, { status: 400 });
        }
        result = await extractPages(buffer, pageNumbers);
        filename = "extracted.pdf";
        break;
      default:
        return NextResponse.json({ error: "Invalid split mode" }, { status: 400 });
    }

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "split-pdf",
      ipAddress: request.headers.get("x-forwarded-for"),
      fileSize: buffer.length,
      processingTimeMs: processingTime,
      status: "completed",
    }).catch(() => {});

    if (Array.isArray(result)) {
      const rangeParts =
        mode === "range" && ranges
          ? ranges.split(",").map((r) => r.trim())
          : [];
      const zipEntryNames = result.map((_, index) => {
        const label = rangeParts[index] ?? String(index + 1);
        const safeName = label.replace(/[^0-9,-]/g, "") || String(index + 1);
        return `page-${safeName}.pdf`;
      });

      return buildPdfBuffersDownloadResponse(
        result,
        "split.pdf",
        "split-pages.zip",
        zipEntryNames
      );
    }

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(result.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to split PDF";

    await logError({
      user_id: userId,
      tool_name: "split-pdf",
      error_type: "SPLIT_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
