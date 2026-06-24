import { NextRequest, NextResponse } from "next/server";
import { composePdfFromSlots } from "@/lib/services/pdf-compose.service";
import { buildPdfBuffersDownloadResponse } from "@/lib/pdf/pdf-buffers-response";
import { resolvePdfBuffer } from "@/lib/pdf/pdf-password.server";
import { splitPDF } from "@/lib/services/pdf-split.service";
import { parseComposeSlots } from "@/lib/api/compose-validation";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { validateBufferMagic } from "@/lib/utils/file-magic";
import { FILE_LIMITS } from "@/config/constants";
import { createClient } from "@/lib/supabase/server";
import { ownerHashFromRequest } from "@/lib/server/request-security";
import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { toSafeApiError } from "@/lib/server/safe-error";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const toolRate = await guardToolRateLimit(request, "compose-pdf");
    if (toolRate) return toolRate;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ownerHash = ownerHashFromRequest(request, user?.id ?? null);

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

    const slots = parseComposeSlots(slotsRaw);
    if (!slots) {
      return NextResponse.json({ error: "Invalid or too many page slots." }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const magic = validateBufferMagic(rawBuffer, ["pdf"]);
    if (!magic.valid) {
      return NextResponse.json(
        { error: magic.message ?? "Invalid PDF file content." },
        { status: 400 }
      );
    }

    const password = (formData.get("password") as string | null) || null;
    let buffer: Buffer;

    try {
      buffer = await resolvePdfBuffer(rawBuffer, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to open PDF";
      if (msg === "PASSWORD_REQUIRED") {
        return NextResponse.json(
          { error: "This PDF is password-protected. Enter the password to continue." },
          { status: 400 }
        );
      }
      if (msg === "WRONG_PASSWORD") {
        return NextResponse.json(
          { error: "Incorrect password. Please try again." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const splitRangesRaw = formData.get("splitRanges") as string | null;

    if (splitRangesRaw) {
      const composed = await composePdfFromSlots(buffer, slots, ownerHash);
      const parsedRanges = splitRangesRaw.split(",").map((r: string) => {
        const [start, end] = r.trim().split("-").map(Number);
        return { start, end: end ?? start };
      });
      const results = await splitPDF(composed, parsedRanges);
      return buildPdfBuffersDownloadResponse(
        results,
        "split.pdf",
        "split-pages.zip",
        results.map((_, i) => `part-${i + 1}.pdf`)
      );
    }

    if (separate) {
      const results: Buffer[] = [];
      for (let i = 0; i < slots.length; i++) {
        results.push(await composePdfFromSlots(buffer, [slots[i]], ownerHash));
      }
      return buildPdfBuffersDownloadResponse(
        results,
        "extracted.pdf",
        "extracted-pages.zip",
        results.map((_, i) => `page-${i + 1}.pdf`)
      );
    }

    const result = await composePdfFromSlots(buffer, slots, ownerHash);

    return new NextResponse(new Uint8Array(result), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="extracted.pdf"',
      },
    });
  } catch (error) {
    console.error("[compose-pdf]", error);
    return NextResponse.json(
      { error: toSafeApiError(error, "Failed to compose PDF") },
      { status: 500 }
    );
  }
}
