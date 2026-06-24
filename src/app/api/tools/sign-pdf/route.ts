import { NextRequest, NextResponse } from "next/server";
import { addSignatureToPDF, applySignAnnotations, type SignAnnotationInput } from "@/lib/services/pdf-sign.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 300;

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

    const usageResult = await checkUsageLimit(userId, request, "sign-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const signature = formData.get("signature") as File | null;
    const positionJson = formData.get("position") as string | null;
    const annotationsJson = formData.get("annotations") as string | null;
    const imageFiles = formData.getAll("images") as File[];

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

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    let signedPdf: Buffer;

    if (annotationsJson) {
      let annotations: SignAnnotationInput[];
      try {
        annotations = JSON.parse(annotationsJson);
      } catch {
        return NextResponse.json({ error: "Invalid annotations JSON" }, { status: 400 });
      }

      if (!Array.isArray(annotations) || annotations.length === 0) {
        return NextResponse.json({ error: "At least one annotation is required" }, { status: 400 });
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
        return NextResponse.json({ error: "Signature image is required" }, { status: 400 });
      }

      if (!positionJson) {
        return NextResponse.json(
          { error: "Position data is required (JSON with x, y, width, height, page)" },
          { status: 400 }
        );
      }

      let position: { x: number; y: number; width: number; height: number; page: number };
      try {
        position = JSON.parse(positionJson);
      } catch {
        return NextResponse.json({ error: "Invalid position JSON" }, { status: 400 });
      }

      if (
        typeof position.x !== "number" ||
        typeof position.y !== "number" ||
        typeof position.width !== "number" ||
        typeof position.height !== "number" ||
        typeof position.page !== "number"
      ) {
        return NextResponse.json(
          { error: "Position must include numeric x, y, width, height, and page" },
          { status: 400 }
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
    const message = error instanceof Error ? error.message : "Failed to sign PDF";

    await logError({
      user_id: userId,
      tool_name: "sign-pdf",
      error_type: "SIGN_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
