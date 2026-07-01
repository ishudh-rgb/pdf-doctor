import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { unlockPDF } from "@/lib/services/pdf-security.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage } from "@/lib/db/queries";
import { getToolRequestUserId } from "@/lib/auth/get-tool-request-user";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "unlock-pdf");
  if (early) return early;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    userId = await getToolRequestUserId();

    const sizeResult = userId
      ? await checkFileSizeLimit(userId)
      : { maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
    const maxSizeMB = sizeResult.maxSizeMB;

    const usageResult = await checkUsageLimit(userId, request, "unlock-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message ?? "Daily usage limit reached." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const password = formData.get("password") as string | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
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

    const buffer = Buffer.from(await file.arrayBuffer());

    let unlockedPdf: Buffer;
    try {
      unlockedPdf = await unlockPDF(buffer, password);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Wrong password";
      if (
        errMsg.toLowerCase().includes("password") ||
        errMsg.toLowerCase().includes("incorrect") ||
        errMsg.toLowerCase().includes("wrong") ||
        errMsg.toLowerCase().includes("invalid")
      ) {
        return NextResponse.json(
          { error: "Incorrect password. Please try again with the correct password." },
          { status: 400 }
        );
      }
      throw err;
    }

    const processingTime = Date.now() - startTime;
    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "unlock-pdf",
      ipAddress: clientIpForLogs(request),
      fileSize: buffer.length,
      processingTimeMs: processingTime,
      status: "completed",
      inputFileNames: [file.name],
      output: {
        buffer: unlockedPdf,
        fileName: "unlocked.pdf",
        mimeType: "application/pdf",
      },
    }).catch(() => {});

    return new NextResponse(new Uint8Array(unlockedPdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="unlocked.pdf"',
        "Content-Length": String(unlockedPdf.length),
      },
    });
  } catch (error) {
    return handleToolRouteFailure(error, {
      toolSlug: "unlock-pdf",
      userId,
      errorType: "UNLOCK_ERROR",
      fallbackMessage: "Failed to unlock PDF",
    });
  }
}
