import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { toolJsonError } from "@/lib/server/tool-api-error";
import { applyEditPdfOperations, type EditPdfOperations } from "@/lib/services/pdf-edit.service";
import { checkUsageLimit } from "@/lib/services/usage-limit.service";
import { resolveToolUserContext } from "@/lib/services/user-tool-context.service";
import { logToolUsage } from "@/lib/db/queries";
import { resolveMutationToolUser } from "@/lib/auth/tool-mutation-auth";
import { validateSingleUpload, uploadValidationResponse } from "@/lib/server/upload-validation";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "edit-pdf");
  if (early) return early;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const mutationAuth = await resolveMutationToolUser(request);
    if (mutationAuth.denied) return mutationAuth.denied;
    userId = mutationAuth.userId;

    const userContext = await resolveToolUserContext(userId);
    const maxSizeMB = userContext.maxSizeMB;

    const usageResult = await checkUsageLimit(userId, request, "edit-pdf");
    if (!usageResult.allowed) {
      return toolJsonError(request, usageResult.message ?? "Daily usage limit reached.", 429);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const operationsJson = formData.get("operations") as string | null;
    const images = formData.getAll("images") as File[];

    if (!file) {
      return toolJsonError(request, "PDF file is required", 400);
    }

    const validated = await validateSingleUpload(file, ["pdf"], maxSizeMB);
    if (!validated.ok) {
      if (validated.error === "Invalid file type.") {
        return toolJsonError(request, "Invalid file type. Only PDF files are accepted.", 400);
      }
      return uploadValidationResponse(request, validated);
    }

    if (!operationsJson) {
      return toolJsonError(request, "Operations JSON is required", 400);
    }

    let operations: EditPdfOperations;
    try {
      operations = JSON.parse(operationsJson);
    } catch {
      return toolJsonError(request, "Invalid operations JSON", 400);
    }

    const imageBuffers = await Promise.all(
      images.map(async (img) => Buffer.from(await img.arrayBuffer()))
    );

    const pdfBuffer = validated.buffer;
    const edited = await applyEditPdfOperations(pdfBuffer, operations, imageBuffers);
    const outputBuffer = Buffer.from(edited);

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "edit-pdf",
      ipAddress: clientIpForLogs(request),
      fileSize: file.size,
      processingTimeMs: processingTime,
      status: "completed",
      inputFileNames: [file.name],
      output: {
        buffer: outputBuffer,
        fileName: "edited.pdf",
        mimeType: "application/pdf",
      },
    }).catch(() => {});

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="edited.pdf"',
        "Content-Length": String(outputBuffer.length),
      },
    });
  } catch (error) {
    return handleToolRouteFailure(error, { request, 
      toolSlug: "edit-pdf",
      userId,
      errorType: "EDIT_ERROR",
      fallbackMessage: "Failed to edit PDF",
    });
  }
}
