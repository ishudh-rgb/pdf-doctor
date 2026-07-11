import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { toolJsonError } from "@/lib/server/tool-api-error";
import { addSignatureToPDF, applySignAnnotations, type SignAnnotationInput } from "@/lib/services/pdf-sign.service";
import { checkFileSizeLimit, requireProPlan } from "@/lib/services/usage-limit.service";
import { logToolUsage } from "@/lib/db/queries";
import { resolveMutationToolUser } from "@/lib/auth/tool-mutation-auth";
import { validateSingleUpload, uploadValidationResponse } from "@/lib/server/upload-validation";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "sign-pdf");
  if (early) return early;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const mutationAuth = await resolveMutationToolUser(request);
    if (mutationAuth.denied) return mutationAuth.denied;
    userId = mutationAuth.userId;

    const proResult = await requireProPlan(userId);
    if (!proResult.allowed) {
      return toolJsonError(request, proResult.message ?? "Pro subscription required.", 403);
    }

    const sizeResult = userId
      ? await checkFileSizeLimit(userId)
      : { maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
    const maxSizeMB = sizeResult.maxSizeMB;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const signature = formData.get("signature") as File | null;
    const positionJson = formData.get("position") as string | null;
    const annotationsJson = formData.get("annotations") as string | null;
    const imageFiles = formData.getAll("images") as File[];

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

    const pdfBuffer = validated.buffer;
    let signedPdf: Buffer;

    if (annotationsJson) {
      let annotations: SignAnnotationInput[];
      try {
        annotations = JSON.parse(annotationsJson);
      } catch {
        return toolJsonError(request, "Invalid annotations JSON", 400);
      }

      if (!Array.isArray(annotations) || annotations.length === 0) {
        return toolJsonError(request, "At least one annotation is required", 400);
      }

      const imageBuffers: Buffer[] = [];
      for (const img of imageFiles) {
        if (img instanceof File && img.size > 0) {
          imageBuffers.push(Buffer.from(await img.arrayBuffer()));
        }
      }

      signedPdf = await applySignAnnotations(pdfBuffer, annotations, imageBuffers);
    } else {
      if (!signature) {
        return toolJsonError(request, "Signature image is required", 400);
      }

      if (!positionJson) {
        return toolJsonError(
          request,
          "Position data is required (JSON with x, y, width, height, page).",
          400
        );
      }

      let position: { x: number; y: number; width: number; height: number; page: number };
      try {
        position = JSON.parse(positionJson);
      } catch {
        return toolJsonError(request, "Invalid position JSON", 400);
      }

      if (
        typeof position.x !== "number" ||
        typeof position.y !== "number" ||
        typeof position.width !== "number" ||
        typeof position.height !== "number" ||
        typeof position.page !== "number"
      ) {
        return toolJsonError(
          request,
          "Position must include numeric x, y, width, height, and page.",
          400
        );
      }

      const signatureBuffer = Buffer.from(await signature.arrayBuffer());
      signedPdf = await addSignatureToPDF(pdfBuffer, signatureBuffer, {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
        page: position.page,
      });
    }

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "sign-pdf",
      ipAddress: clientIpForLogs(request),
      fileSize: pdfBuffer.length,
      processingTimeMs: processingTime,
      status: "completed",
      inputFileNames: [file.name],
      output: {
        buffer: signedPdf,
        fileName: "signed.pdf",
        mimeType: "application/pdf",
      },
    }).catch(() => {});

    return new NextResponse(new Uint8Array(signedPdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="signed.pdf"',
        "Content-Length": String(signedPdf.length),
      },
    });
  } catch (error) {
    return handleToolRouteFailure(error, { request, 
      toolSlug: "sign-pdf",
      userId,
      errorType: "SIGN_ERROR",
      fallbackMessage: "Failed to sign PDF",
    });
  }
}
