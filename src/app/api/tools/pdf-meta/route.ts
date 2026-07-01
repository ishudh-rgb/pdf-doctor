import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { getPdfPageCountFromBuffer } from "@/lib/pdf/pdf-read.server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "pdf-meta");
  if (early) return early;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (!isValidFileType(file, ["pdf"])) {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    const sizeCheck = validateFileSize(file, FILE_LIMITS.maxFreeFileSizeMB);
    if (!sizeCheck.valid) {
      return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const totalPages = await getPdfPageCountFromBuffer(buffer);

    return NextResponse.json({ totalPages });
  } catch (error) {
    return handleToolRouteFailure(error, {
      toolSlug: "pdf-meta",
      errorType: "META_ERROR",
      fallbackMessage: "Failed to read PDF",
    });
  }
}
