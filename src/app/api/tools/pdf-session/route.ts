import { NextRequest, NextResponse } from "next/server";
import { createPdfSession } from "@/lib/pdf/pdf-session-store";
import { ownerHashFromRequest } from "@/lib/server/request-security";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { createClient } from "@/lib/supabase/server";
import { probePdfAccess } from "@/lib/pdf/pdf-password.server";
import { unlockPDF } from "@/lib/services/pdf-security.service";

export const runtime = "nodejs";
export const maxDuration = 60;

const WRONG_PASSWORD_MSG = "Incorrect password. Please try again.";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ownerHash = ownerHashFromRequest(request, user?.id ?? null);

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
    const withoutPassword = await probePdfAccess(buffer);

    if (withoutPassword.status === "unreadable") {
      return NextResponse.json({ error: withoutPassword.message }, { status: 400 });
    }

    let totalPages = withoutPassword.status === "ok" ? withoutPassword.pages : 0;

    if (withoutPassword.status === "password_required") {
      if (!password) {
        return NextResponse.json(
          { error: "This PDF is password-protected.", code: "password_required", fileName: file.name },
          { status: 400 }
        );
      }

      const withPassword = await probePdfAccess(buffer, password);
      if (withPassword.status === "wrong_password") {
        return NextResponse.json(
          { error: WRONG_PASSWORD_MSG, code: "wrong_password" },
          { status: 400 }
        );
      }
      if (withPassword.status !== "ok") {
        return NextResponse.json(
          { error: withPassword.status === "unreadable" ? withPassword.message : WRONG_PASSWORD_MSG },
          { status: 400 }
        );
      }

      try {
        buffer = Buffer.from(await unlockPDF(buffer, password));
        const unlocked = await probePdfAccess(buffer);
        if (unlocked.status === "ok") {
          totalPages = unlocked.pages;
        } else {
          totalPages = withPassword.pages;
        }
      } catch (unlockErr) {
        const msg = unlockErr instanceof Error ? unlockErr.message : WRONG_PASSWORD_MSG;
        return NextResponse.json(
          {
            error: msg.includes("Incorrect password") ? msg : WRONG_PASSWORD_MSG,
            code: "wrong_password",
          },
          { status: 400 }
        );
      }
    }

    if (totalPages === 0) {
      return NextResponse.json({ error: "Could not read this PDF." }, { status: 400 });
    }

    const sessionId = await createPdfSession(buffer, ownerHash);

    return NextResponse.json({
      sessionId,
      totalPages,
      truncated: totalPages > 500,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to open PDF";
    console.error("[pdf-session]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
