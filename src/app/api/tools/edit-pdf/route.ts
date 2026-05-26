import { NextRequest, NextResponse } from "next/server";
import { addTextToPDF, addImageToPDF } from "@/lib/services/pdf-edit.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const maxDuration = 60;

interface TextOperation {
  text: string;
  x: number;
  y: number;
  page: number;
  fontSize?: number;
  color?: string;
}

interface ImageOperation {
  imageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

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
    const operationsJson = formData.get("operations") as string | null;
    const images = formData.getAll("images") as File[];

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

    if (!operationsJson) {
      return NextResponse.json(
        { error: "Operations JSON is required" },
        { status: 400 }
      );
    }

    let operations: { texts?: TextOperation[]; images?: ImageOperation[] };
    try {
      operations = JSON.parse(operationsJson);
    } catch {
      return NextResponse.json({ error: "Invalid operations JSON" }, { status: 400 });
    }

    let pdfBuffer: Buffer = Buffer.from(await file.arrayBuffer()) as Buffer;

    if (operations.texts && operations.texts.length > 0) {
      pdfBuffer = await addTextToPDF(pdfBuffer, operations.texts);
    }

    if (operations.images && operations.images.length > 0) {
      for (const imgOp of operations.images) {
        if (imgOp.imageIndex >= images.length) {
          return NextResponse.json(
            { error: `Image at index ${imgOp.imageIndex} not found` },
            { status: 400 }
          );
        }

        const imageBuffer: Buffer = Buffer.from(await images[imgOp.imageIndex].arrayBuffer()) as Buffer;
        pdfBuffer = await addImageToPDF(pdfBuffer, imageBuffer, {
          x: imgOp.x,
          y: imgOp.y,
          width: imgOp.width,
          height: imgOp.height,
          page: imgOp.page,
        });
      }
    }

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "edit-pdf",
      ipAddress: request.headers.get("x-forwarded-for"),
      fileSize: file.size,
      processingTimeMs: processingTime,
      status: "completed",
    }).catch(() => {});

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="edited.pdf"',
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to edit PDF";

    await logError({
      user_id: userId,
      tool_name: "edit-pdf",
      error_type: "EDIT_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
