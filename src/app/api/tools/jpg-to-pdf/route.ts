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
  const early = await beginToolRoute(request, "jpg-to-pdf");
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

    const usageResult = await checkUsageLimit(userId, request, "jpg-to-pdf");
    if (!usageResult.allowed) {
      return toolJsonError(request, usageResult.message ?? "Daily usage limit reached.", 429);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return toolJsonError(request, "Upload too large or invalid. Try fewer images or check your connection.", 413);
    }

    const files = formData.getAll("files") as File[];
    const pageSize = (formData.get("pageSize") as string) || "a4";
    const orientation = (formData.get("orientation") as string) || "portrait";
    const marginRaw = (formData.get("margin") as string) || "small";
    const margin = marginRaw === "medium" ? "normal" : marginRaw;

    if (!files || files.length === 0) {
      return toolJsonError(request, "At least one image file is required", 400);
    }

    if (files.length > 20) {
      return toolJsonError(request, "Maximum 20 images allowed", 400);
    }

    const imageBuffers: Buffer[] = [];
    for (const file of files) {
      const validated = await validateSingleUpload(file, ["image"], maxSizeMB);
      if (!validated.ok) {
        if (validated.error === "Invalid file type.") {
          return toolJsonError(
            request,
            `Invalid file type: ${file.name}. Only image files (JPG, PNG, WebP, GIF) are accepted.`,
            400
          );
        }
        return uploadValidationResponse(request, validated);
      }
      imageBuffers.push(validated.buffer);
    }

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
      inputFileNames: files.map((f) => f.name),
      output: {
        buffer: pdfBuffer,
        fileName: "images-to-pdf.pdf",
        mimeType: "application/pdf",
      },
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
    return handleToolRouteFailure(error, { request, 
      toolSlug: "jpg-to-pdf",
      userId,
      errorType: "CONVERT_ERROR",
      fallbackMessage: "Failed to convert images to PDF",
    });
  }
}
