import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { applyEditPdfOperations, type EditPdfOperations } from "@/lib/services/pdf-edit.service";
import { checkUsageLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, getUserProfile } from "@/lib/db/queries";
import { getToolRequestUserId } from "@/lib/auth/get-tool-request-user";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "edit-pdf");
  if (early) return early;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    userId = await getToolRequestUserId();

    const isPro = userId ? (await getUserProfile(userId)).plan === "pro" : false;
    const maxSizeMB = isPro ? FILE_LIMITS.maxProFileSizeMB : FILE_LIMITS.maxFreeFileSizeMB;

    const usageResult = await checkUsageLimit(userId, request, "edit-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

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
      return NextResponse.json({ error: "Operations JSON is required" }, { status: 400 });
    }

    let operations: EditPdfOperations;
    try {
      operations = JSON.parse(operationsJson);
    } catch {
      return NextResponse.json({ error: "Invalid operations JSON" }, { status: 400 });
    }

    const imageBuffers = await Promise.all(
      images.map(async (img) => Buffer.from(await img.arrayBuffer()))
    );

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
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
    return handleToolRouteFailure(error, {
      toolSlug: "edit-pdf",
      userId,
      errorType: "EDIT_ERROR",
      fallbackMessage: "Failed to edit PDF",
    });
  }
}
