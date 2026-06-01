import { NextRequest, NextResponse } from "next/server";
import { composePdfFromSlots, type ComposeSlot } from "@/lib/services/pdf-compose.service";
import { splitPDF } from "@/lib/services/pdf-split.service";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slotsRaw = formData.get("slots") as string | null;
    const separate = formData.get("separate") === "true";

    if (!file || !slotsRaw) {
      return NextResponse.json({ error: "PDF file and slots are required" }, { status: 400 });
    }

    if (!isValidFileType(file, ["pdf"])) {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    const sizeCheck = validateFileSize(file, FILE_LIMITS.maxFreeFileSizeMB);
    if (!sizeCheck.valid) {
      return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
    }

    const slots = JSON.parse(slotsRaw) as ComposeSlot[];
    const buffer = Buffer.from(await file.arrayBuffer());
    const splitRangesRaw = formData.get("splitRanges") as string | null;

    if (splitRangesRaw) {
      const composed = await composePdfFromSlots(buffer, slots);
      const parsedRanges = splitRangesRaw.split(",").map((r: string) => {
        const [start, end] = r.trim().split("-").map(Number);
        return { start, end: end ?? start };
      });
      const results = await splitPDF(composed, parsedRanges);
      const { buildZip } = await import("@/lib/services/zip-builder");
      const filesMap: Record<string, Buffer> = {};
      results.forEach((b, i) => {
        filesMap[`part-${i + 1}.pdf`] = b;
      });
      const zipBuffer = await buildZip(filesMap);
      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="split-pages.zip"',
        },
      });
    }

    if (separate) {
      const results: Buffer[] = [];
      for (let i = 0; i < slots.length; i++) {
        results.push(await composePdfFromSlots(buffer, [slots[i]]));
      }
      const { buildZip } = await import("@/lib/services/zip-builder");
      const filesMap: Record<string, Buffer> = {};
      results.forEach((b, i) => {
        filesMap[`page-${i + 1}.pdf`] = b;
      });
      const zipBuffer = await buildZip(filesMap);
      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="extracted-pages.zip"',
        },
      });
    }

    const result = await composePdfFromSlots(buffer, slots);

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="extracted.pdf"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compose PDF";
    console.error("[compose-pdf]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
