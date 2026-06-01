import { NextRequest, NextResponse } from "next/server";
import { getPdfPageCountFromBuffer } from "@/lib/pdf/pdf-read.server";
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
    const totalPages = await getPdfPageCountFromBuffer(buffer);

    return NextResponse.json({ totalPages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read PDF";
    console.error("[pdf-meta]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
