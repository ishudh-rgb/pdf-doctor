import { guardToolRateLimit } from "@/lib/server/rate-limiter";
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
  const rateLimited = await guardToolRateLimit(request, "pdf-scanner");
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

    const usageResult = await checkUsageLimit(userId, request, "pdf-scanner");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const filter = (formData.get("filter") as string) || "none";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "At least one image file is required" },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images allowed for scanning" },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!isValidFileType(file, ["image"])) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only image files are accepted.` },
          { status: 400 }
        );
      }

      const sizeCheck = validateFileSize(file, maxSizeMB);
      if (!sizeCheck.valid) {
        return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
      }
    }

    const sharp = (await import("sharp")).default;

    const processedImages = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        let imageBuffer: Buffer = Buffer.from(arrayBuffer) as Buffer;

        if (filter !== "none") {
          let pipeline = sharp(imageBuffer);

          switch (filter) {
            case "grayscale":
              pipeline = pipeline.grayscale();
              break;
            case "blackwhite":
              pipeline = pipeline.grayscale().threshold(128);
              break;
            case "highcontrast":
              pipeline = pipeline.normalize().sharpen();
              break;
            case "brighten":
              pipeline = pipeline.modulate({ brightness: 1.3 });
              break;
          }

          imageBuffer = await pipeline.png().toBuffer() as Buffer;
        }

        return imageBuffer;
      })
    );

    const pdfBuffer = await jpgToPdf(processedImages, {
      pageSize: "a4",
      orientation: "portrait",
      margin: "small",
    });

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "pdf-scanner",
      ipAddress: clientIpForLogs(request),
      fileSize: files.reduce((sum, f) => sum + f.size, 0),
      processingTimeMs: processingTime,
      status: "completed",
      inputFileNames: files.map((f) => f.name),
      output: {
        buffer: pdfBuffer,
        fileName: "scanned-document.pdf",
        mimeType: "application/pdf",
      },
    }).catch(() => {});

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="scanned-document.pdf"',
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create scanned PDF";

    await logError({
      user_id: userId,
      tool_name: "pdf-scanner",
      error_type: "SCANNER_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
