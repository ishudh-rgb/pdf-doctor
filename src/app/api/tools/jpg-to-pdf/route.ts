import { NextRequest, NextResponse } from "next/server";
import { jpgToPdf } from "@/lib/services/pdf-convert.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

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

    const usageResult = await checkUsageLimit(userId, request, "jpg-to-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          error:
            "Upload too large or invalid. Try fewer images or check your connection.",
        },
        { status: 413 }
      );
    }

    const files = formData.getAll("files") as File[];
    const pageSize = (formData.get("pageSize") as string) || "a4";
    const orientation = (formData.get("orientation") as string) || "portrait";
    const marginRaw = (formData.get("margin") as string) || "small";
    const margin = marginRaw === "medium" ? "normal" : marginRaw;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "At least one image file is required" },
        { status: 400 }
      );
    }

    if (files.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 images allowed" },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!isValidFileType(file, ["image"])) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only image files (JPG, PNG, WebP, GIF) are accepted.` },
          { status: 400 }
        );
      }

      const sizeCheck = validateFileSize(file, maxSizeMB);
      if (!sizeCheck.valid) {
        return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
      }
    }

    const imageBuffers = await Promise.all(
      files.map(async (file) => Buffer.from(await file.arrayBuffer()))
    );

    const pdfBuffer = await jpgToPdf(imageBuffers, {
      pageSize,
      orientation: orientation as "portrait" | "landscape",
      margin,
    });

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "jpg-to-pdf",
      ipAddress: clientIpForLogs(request),
      fileSize: imageBuffers.reduce((sum, img) => sum + img.length, 0),
      processingTimeMs: processingTime,
      status: "completed",
    }).catch(() => {});

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="images-to-pdf.pdf"',
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to convert images to PDF";

    await logError({
      user_id: userId,
      tool_name: "jpg-to-pdf",
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
