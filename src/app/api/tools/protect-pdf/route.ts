import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { toolJsonError } from "@/lib/server/tool-api-error";
import { protectPDF } from "@/lib/services/pdf-security.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage } from "@/lib/db/queries";
import { resolveMutationToolUser } from "@/lib/auth/tool-mutation-auth";
import { validateSingleUpload, uploadValidationResponse } from "@/lib/server/upload-validation";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "protect-pdf");
  if (early) return early;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const mutationAuth = await resolveMutationToolUser(request);
    if (mutationAuth.denied) return mutationAuth.denied;
    userId = mutationAuth.userId;

    const sizeResult = userId
      ? await checkFileSizeLimit(userId, 0)
      : { allowed: true, maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
    const maxSizeMB = sizeResult.maxSizeMB;

    const usageResult = await checkUsageLimit(
      userId,
      request,
      "protect-pdf"
    );
    if (!usageResult.allowed) {
      return toolJsonError(request, usageResult.message ?? "Daily usage limit reached.", 429);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const password = formData.get("password") as string | null;

    if (!file) {
      return toolJsonError(request, "PDF file is required", 400);
    }

    if (!password || password.length < 4) {
      return toolJsonError(request, "Password is required and must be at least 4 characters", 400);
    }

    const validated = await validateSingleUpload(file, ["pdf"], maxSizeMB);
    if (!validated.ok) {
      if (validated.error === "Invalid file type.") {
        return toolJsonError(request, "Invalid file type. Only PDF files are accepted.", 400);
      }
      return uploadValidationResponse(request, validated);
    }

    const buffer = validated.buffer;
    const protectedPdf = await protectPDF(buffer, password);

    const processingTime = Date.now() - startTime;
    void logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "protect-pdf",
      ipAddress: clientIpForLogs(request),
      fileSize: buffer.length,
      processingTimeMs: processingTime,
      status: "completed",
      inputFileNames: [file.name],
      output: {
        buffer: protectedPdf,
        fileName: "protected.pdf",
        mimeType: "application/pdf",
      },
    }).catch(() => {});

    return new NextResponse(new Uint8Array(protectedPdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="protected.pdf"',
        "Content-Length": String(protectedPdf.length),
      },
    });
  } catch (error) {
    return handleToolRouteFailure(error, { request, 
      toolSlug: "protect-pdf",
      userId,
      errorType: "PROTECT_ERROR",
      fallbackMessage: "Failed to protect PDF",
    });
  }
}
