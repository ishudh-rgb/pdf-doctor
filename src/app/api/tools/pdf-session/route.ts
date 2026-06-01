import { NextRequest, NextResponse } from "next/server";
import { createPdfSession } from "@/lib/pdf/pdf-session-store";
import { getTotalPages } from "@/lib/pdf/pdf-thumbnails.server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
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
    const totalPages = await getTotalPages(buffer);

    if (totalPages === 0) {
      return NextResponse.json({ error: "Could not read this PDF." }, { status: 400 });
    }

    const sessionId = await createPdfSession(buffer);

    return NextResponse.json({
      sessionId,
      totalPages,
      truncated: totalPages > 60,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to open PDF";
    console.error("[pdf-session]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
