import { NextRequest, NextResponse } from "next/server";
import { createPdfSession, buildOwnerHash } from "@/lib/pdf/pdf-session-store";
import { getTotalPages } from "@/lib/pdf/pdf-thumbnails.server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { createClient } from "@/lib/supabase/server";
import { unlockPDF } from "@/lib/services/pdf-security.service";

export const runtime = "nodejs";
export const maxDuration = 60;

function looksEncrypted(buffer: Buffer): boolean {
  return buffer.includes(Buffer.from("/Encrypt"));
}

async function tryLoadPages(
  buffer: Buffer,
  skipEncryptCheck = false
): Promise<{ pages: number; encrypted: boolean }> {
  if (!skipEncryptCheck && looksEncrypted(buffer)) {
    return { pages: 0, encrypted: true };
  }

  try {
    const pages = await getTotalPages(buffer);
    return { pages, encrypted: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    const isEnc =
      msg.includes("encrypt") ||
      msg.includes("password") ||
      msg.includes("decrypt") ||
      msg.includes("cannot transfer");
    if (isEnc) {
      return { pages: 0, encrypted: true };
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerHash = buildOwnerHash(user?.id ?? null, request.headers.get("x-forwarded-for"));

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string | null) || null;

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

    let buffer = Buffer.from(await file.arrayBuffer());

    let result = await tryLoadPages(buffer);

    if (result.encrypted && password) {
      try {
        buffer = await unlockPDF(buffer, password);
      } catch (unlockErr) {
        const msg = unlockErr instanceof Error ? unlockErr.message : "Wrong password";
        return NextResponse.json(
          { error: msg, code: "wrong_password" },
          { status: 400 }
        );
      }

      try {
        result = await tryLoadPages(buffer, true);
      } catch (parseErr) {
        console.error("[pdf-session] parse after unlock failed:", parseErr);
        return NextResponse.json(
          { error: "Could not read PDF after unlocking. The file may be corrupted." },
          { status: 400 }
        );
      }
    }

    if (result.encrypted) {
      return NextResponse.json(
        { error: "This PDF is password-protected.", code: "password_required", fileName: file.name },
        { status: 400 }
      );
    }

    if (result.pages === 0) {
      return NextResponse.json({ error: "Could not read this PDF." }, { status: 400 });
    }

    const sessionId = await createPdfSession(buffer, ownerHash);

    return NextResponse.json({
      sessionId,
      totalPages: result.pages,
      truncated: result.pages > 500,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to open PDF";
    console.error("[pdf-session]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
