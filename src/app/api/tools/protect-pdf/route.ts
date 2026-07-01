import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { protectPDF } from "@/lib/services/pdf-security.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage } from "@/lib/db/queries";
import { getToolRequestUserId } from "@/lib/auth/get-tool-request-user";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { clientIpForLogs } from "@/lib/server/request-security";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "protect-pdf");
  if (early) return early;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    userId = await getToolRequestUserId();

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
      return NextResponse.json({ error: usageResult.message }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const password = formData.get("password") as string | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: "Password is required and must be at least 4 characters" },
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

    const buffer = Buffer.from(await file.arrayBuffer());
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
    return handleToolRouteFailure(error, {
      toolSlug: "protect-pdf",
      userId,
      errorType: "PROTECT_ERROR",
      fallbackMessage: "Failed to protect PDF",
    });
  }
}
