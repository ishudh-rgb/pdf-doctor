import { NextRequest, NextResponse } from "next/server";
import { checkUsageLimit, checkFileSizeLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize, sanitizeFilename } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";

interface ToolRouteOptions {
  toolSlug: string;
  allowedTypes: string[];
  contentType: string;
  outputExtension: string;
  maxDuration?: number;
  convert: (buffer: Buffer, file: File, formData: FormData) => Promise<Buffer>;
  outputName?: (originalName: string) => string;
}

export function createToolRoute(options: ToolRouteOptions) {
  const handler = async (request: NextRequest) => {
    const startTime = Date.now();
    let userId: string | null = null;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;

      const sizeResult = userId
        ? await checkFileSizeLimit(userId, 0)
        : { allowed: true, maxSizeMB: FILE_LIMITS.maxFreeFileSizeMB };
      const maxSizeMB = sizeResult.maxSizeMB;

      const usageResult = await checkUsageLimit(
        userId,
        request.headers.get("x-forwarded-for"),
        options.toolSlug
      );
      if (!usageResult.allowed) {
        return NextResponse.json({ error: usageResult.message }, { status: 429 });
      }

      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "File is required" }, { status: 400 });
      }

      if (!isValidFileType(file, options.allowedTypes)) {
        return NextResponse.json(
          { error: `Invalid file type for ${options.toolSlug}.` },
          { status: 400 }
        );
      }

      const sizeCheck = validateFileSize(file, maxSizeMB);
      if (!sizeCheck.valid) {
        return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const outputBuffer = await options.convert(buffer, file, formData);

      const baseName = options.outputName
        ? options.outputName(file.name)
        : file.name.replace(/\.[^.]+$/, "");

      await logToolUsage({
        userId,
        sessionId: request.headers.get("x-session-id") || "anonymous",
        toolSlug: options.toolSlug,
        ipAddress: request.headers.get("x-forwarded-for"),
        fileSize: buffer.length,
        processingTimeMs: Date.now() - startTime,
        status: "completed",
      }).catch(() => {});

      return new NextResponse(new Uint8Array(outputBuffer), {
        status: 200,
        headers: {
          "Content-Type": options.contentType,
          "Content-Disposition": `attachment; filename="${sanitizeFilename(baseName)}.${options.outputExtension}"`,
          "Content-Length": String(outputBuffer.length),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Processing failed";

      await logError({
        user_id: userId,
        tool_name: options.toolSlug,
        error_type: "TOOL_ERROR",
        error_message: message,
        stack_trace: error instanceof Error ? error.stack : undefined,
      }).catch(() => {});

      return NextResponse.json({ error: message }, { status: 500 });
    }
  };

  return handler;
}

export const TOOL_MAX_DURATION = 60;
