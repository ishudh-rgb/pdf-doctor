import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { mergePDFs } from "@/lib/services/pdf-merge.service";
import { resolvePdfBuffer } from "@/lib/pdf/pdf-password.server";
import { checkUsageLimit } from "@/lib/services/usage-limit.service";
import { resolveToolUserContext } from "@/lib/services/user-tool-context.service";
import { logUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { getGuestUsageKey } from "@/lib/server/client-ip";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rateLimited = await guardToolRateLimit(request, "merge-pdf");
  if (rateLimited) return rateLimited;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const usageResult = await checkUsageLimit(userId, request, "merge-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message }, { status: 429 });
    }

    const userContext = await resolveToolUserContext(userId);
    const maxSizeMB = userContext.maxSizeMB;
    const maxFiles = userContext.isPro
      ? FILE_LIMITS.maxFilesPerMergePro
      : FILE_LIMITS.maxFilesPerMerge;
    const ipHash = getGuestUsageKey(request);

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length < 2) {
      return NextResponse.json(
        { error: "At least 2 PDF files are required" },
        { status: 400 }
      );
    }

    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} files allowed` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!isValidFileType(file, ["pdf"])) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only PDF files are accepted.` },
          { status: 400 }
        );
      }

      const sizeCheck = validateFileSize(file, maxSizeMB);
      if (!sizeCheck.valid) {
        return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
      }
    }

    let passwords: Array<string | null> = [];
    const passwordsRaw = formData.get("passwords");
    if (typeof passwordsRaw === "string" && passwordsRaw.trim()) {
      try {
        const parsed = JSON.parse(passwordsRaw) as unknown;
        if (Array.isArray(parsed)) {
          passwords = parsed.map((value) =>
            typeof value === "string" && value.length > 0 ? value : null
          );
        }
      } catch {
        // Ignore malformed password payload — treat as unlocked PDFs.
      }
    }

    const buffers = await Promise.all(
      files.map(async (file, index) => {
        const raw = Buffer.from(await file.arrayBuffer());
        const password = passwords[index] ?? null;
        try {
          return await resolvePdfBuffer(raw, password);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed to open PDF";
          if (msg === "PASSWORD_REQUIRED") {
            throw new Error(
              `${file.name} is password-protected. Enter its password and try again.`
            );
          }
          if (msg === "WRONG_PASSWORD") {
            throw new Error(`Incorrect password for ${file.name}. Please try again.`);
          }
          throw err;
        }
      })
    );

    const mergedPdf = await mergePDFs(buffers);

    const processingTime = Date.now() - startTime;
    await logUsage({
      user_id: userId,
      guest_ip_hash: userId ? null : ipHash,
      tool_name: "merge-pdf",
      file_size_bytes: buffers.reduce((sum, b) => sum + b.length, 0),
      processing_time_ms: processingTime,
      status: "success",
    }).catch(() => {});

    return new NextResponse(new Uint8Array(mergedPdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged.pdf"',
        "Content-Length": String(mergedPdf.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to merge PDFs";

    await logError({
      user_id: userId,
      tool_name: "merge-pdf",
      error_type: "MERGE_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
