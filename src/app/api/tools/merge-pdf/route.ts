import { NextRequest, NextResponse } from "next/server";
import { mergePDFs } from "@/lib/services/pdf-merge.service";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    const ipHash = request.headers.get("x-forwarded-for") || "unknown";

    const sizeResult = userId
      ? await checkFileSizeLimit(userId, 0)
      : { allowed: true, maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
    const maxSizeMB = sizeResult.maxSizeMB;
    const maxFiles = sizeResult.maxSizeMB > 25 ? FILE_LIMITS.maxFilesPerMergePro : FILE_LIMITS.maxFilesPerMerge;

    const usageResult = await checkUsageLimit(userId, ipHash, "merge-pdf");
    if (!usageResult.allowed) {
      return NextResponse.json({ error: usageResult.message }, { status: 429 });
    }

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

    const buffers = await Promise.all(
      files.map(async (file) => Buffer.from(await file.arrayBuffer()))
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
