import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { toolJsonError } from "@/lib/server/tool-api-error";
import { jpgToPdf } from "@/lib/services/pdf-convert.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage } from "@/lib/db/queries";
import { resolveMutationToolUser } from "@/lib/auth/tool-mutation-auth";
import { validateSingleUpload, uploadValidationResponse } from "@/lib/server/upload-validation";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "pdf-scanner");
  if (early) return early;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const mutationAuth = await resolveMutationToolUser(request);
    if (mutationAuth.denied) return mutationAuth.denied;
    userId = mutationAuth.userId;

    const sizeResult = userId
      ? await checkFileSizeLimit(userId)
      : { maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
    const maxSizeMB = sizeResult.maxSizeMB;

    const usageResult = await checkUsageLimit(userId, request, "pdf-scanner");
    if (!usageResult.allowed) {
      return toolJsonError(request, usageResult.message ?? "Daily usage limit reached.", 429);
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const filter = (formData.get("filter") as string) || "none";

    if (!files || files.length === 0) {
      return toolJsonError(request, "At least one image file is required", 400);
    }

    if (files.length > 10) {
      return toolJsonError(request, "Maximum 10 images allowed for scanning", 400);
    }

    const imageBuffers: Buffer[] = [];
    for (const file of files) {
      const validated = await validateSingleUpload(file, ["image"], maxSizeMB);
      if (!validated.ok) {
        if (validated.error === "Invalid file type.") {
          return toolJsonError(request, `Invalid file type: ${file.name}. Only image files are accepted.`, 400);
        }
        return uploadValidationResponse(request, validated);
      }
      imageBuffers.push(validated.buffer);
    }

    const sharp = (await import("sharp")).default;

    const processedImages = await Promise.all(
      files.map(async (_, index) => {
        let imageBuffer: Buffer = imageBuffers[index];

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
    return handleToolRouteFailure(error, { request, 
      toolSlug: "pdf-scanner",
      userId,
      errorType: "SCANNER_ERROR",
      fallbackMessage: "Failed to create scanned PDF",
    });
  }
}
