import { NextRequest, NextResponse } from "next/server";
import {
  cacheThumb,
  getCachedThumb,
  getPdfSessionBuffer,
} from "@/lib/pdf/pdf-session-store";
import { renderPageThumb } from "@/lib/pdf/pdf-thumbnails.server";

export const runtime = "nodejs";
export const maxDuration = 60;

function thumbCacheKey(page: number, width: number): string {
  return width === 140 ? String(page) : `${page}@${width}`;
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session");
    const page = parseInt(request.nextUrl.searchParams.get("page") ?? "0", 10);
    const widthParam = request.nextUrl.searchParams.get("width");
    const desiredWidth = widthParam
      ? Math.min(1200, Math.max(40, parseInt(widthParam, 10) || 140))
      : 140;

    if (!sessionId || page < 1) {
      return NextResponse.json({ error: "Invalid session or page" }, { status: 400 });
    }

    const buffer = await getPdfSessionBuffer(sessionId);
    if (!buffer) {
      return NextResponse.json({ error: "Session expired. Re-upload the PDF." }, { status: 410 });
    }

    const cacheKey = thumbCacheKey(page, desiredWidth);
    let dataUrl = getCachedThumb(sessionId, cacheKey);
    if (!dataUrl) {
      dataUrl = await renderPageThumb(buffer, page, desiredWidth);
      if (dataUrl) cacheThumb(sessionId, cacheKey, dataUrl);
    }

    if (!dataUrl) {
      return NextResponse.json({ error: "Could not render page" }, { status: 500 });
    }

    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64, "base64");

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to render thumbnail";
    console.error("[pdf-thumb]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
