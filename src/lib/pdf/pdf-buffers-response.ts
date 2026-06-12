import { NextResponse } from "next/server";
import { buildZip } from "@/lib/services/zip-builder";

/** Return a single PDF when there is one buffer; otherwise a ZIP of all parts. */
export async function buildPdfBuffersDownloadResponse(
  buffers: Buffer[],
  pdfFilename: string,
  zipFilename: string,
  zipEntryNames?: string[]
): Promise<NextResponse> {
  if (buffers.length === 0) {
    throw new Error("No PDF output generated.");
  }

  if (buffers.length === 1) {
    const buffer = buffers[0];
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  }

  const filesMap: Record<string, Buffer> = {};
  buffers.forEach((buffer, index) => {
    const name = zipEntryNames?.[index] ?? `part-${index + 1}.pdf`;
    filesMap[name] = buffer;
  });
  const zipBuffer = await buildZip(filesMap);

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFilename}"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
