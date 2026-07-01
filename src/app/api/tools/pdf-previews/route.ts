import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { renderPdfThumbnailsServer } from "@/lib/pdf/pdf-thumbnails.server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "pdf-previews");
  if (early) return early;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const startPage = Math.max(1, parseInt(String(formData.get("startPage") ?? "1"), 10) || 1);
    const endPage = Math.max(
      startPage,
      parseInt(String(formData.get("endPage") ?? "0"), 10) || 0
    );
    const maxPages = Math.min(
      60,
      Math.max(1, parseInt(String(formData.get("maxPages") ?? "60"), 10) || 60)
    );

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
    const result = await renderPdfThumbnailsServer(buffer, {
      startPage,
      endPage: endPage > 0 ? endPage : undefined,
      maxPages,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleToolRouteFailure(error, {
      toolSlug: "pdf-previews",
      errorType: "PREVIEW_ERROR",
      fallbackMessage: "Failed to render previews",
    });
  }
}
