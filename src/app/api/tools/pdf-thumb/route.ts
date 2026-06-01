import { NextRequest, NextResponse } from "next/server";
import {
  cacheThumb,
  getCachedThumb,
  getPdfSessionBuffer,
} from "@/lib/pdf/pdf-session-store";
import { renderPageThumb } from "@/lib/pdf/pdf-thumbnails.server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session");
    const page = parseInt(request.nextUrl.searchParams.get("page") ?? "0", 10);

    if (!sessionId || page < 1) {
      return NextResponse.json({ error: "Invalid session or page" }, { status: 400 });
    }

    const buffer = await getPdfSessionBuffer(sessionId);
    if (!buffer) {
      return NextResponse.json({ error: "Session expired. Re-upload the PDF." }, { status: 410 });
    }

    let dataUrl = getCachedThumb(sessionId, page);
    if (!dataUrl) {
      dataUrl = await renderPageThumb(buffer, page);
      if (dataUrl) cacheThumb(sessionId, page, dataUrl);
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
