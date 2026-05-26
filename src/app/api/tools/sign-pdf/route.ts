import { NextRequest, NextResponse } from "next/server";
import { addSignatureToPDF } from "@/lib/services/pdf-sign.service";
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

    const isPro = user ? await checkFileSizeLimit(user.id) : false;
    const maxSizeMB = isPro ? FILE_LIMITS.maxProFileSizeMB : FILE_LIMITS.maxFreeFileSizeMB;

    await checkUsageLimit(userId, request.headers.get("x-forwarded-for"));

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const signature = formData.get("signature") as File | null;
    const positionJson = formData.get("position") as string | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Signature image is required" }, { status: 400 });
    }

    if (!positionJson) {
      return NextResponse.json(
        { error: "Position data is required (JSON with x, y, width, height, page)" },
        { status: 400 }
      );
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

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const signatureBuffer = Buffer.from(await signature.arrayBuffer());

    const signedPdf = await addSignatureToPDF(pdfBuffer, signatureBuffer, {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      page: position.page,
    });

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "sign-pdf",
      ipAddress: request.headers.get("x-forwarded-for"),
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
