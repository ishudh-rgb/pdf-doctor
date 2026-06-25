import { NextRequest, NextResponse } from "next/server";
import { checkUsageLimit } from "@/lib/services/usage-limit.service";
import { resolveToolUserContext } from "@/lib/services/user-tool-context.service";
import { withHeavyJobGuard } from "@/lib/server/conversion-semaphore";
import { logToolUsage, logError } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { isValidFileType, validateFileSize, sanitizeFilename } from "@/lib/utils/file";
import { getGuestUsageKey } from "@/lib/server/client-ip";
import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { toSafeApiError, captureApiError } from "@/lib/server/safe-error";
import { validateBufferMagic } from "@/lib/utils/file-magic";
import { clientIpForLogs } from "@/lib/server/request-security";

interface ToolRouteOptions {
  toolSlug: string;
  allowedTypes: string[];
  contentType: string;
  outputExtension: string;
  maxDuration?: number;
  heavy?: boolean;
  convert: (buffer: Buffer, file: File, formData: FormData) => Promise<Buffer>;
  outputName?: (originalName: string) => string;
}

export function createToolRoute(options: ToolRouteOptions) {
  const handler = async (request: NextRequest) => {
    const startTime = Date.now();
    let userId: string | null = null;

    try {
      const toolRate = await guardToolRateLimit(request, options.toolSlug);
      if (toolRate) return toolRate;

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;

      const userContext = await resolveToolUserContext(userId);
      const maxSizeMB = userContext.maxSizeMB;

      const usageResult = await checkUsageLimit(
        userId,
        getGuestUsageKey(request),
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

      const magic = validateBufferMagic(buffer, options.allowedTypes);
      if (!magic.valid) {
        return NextResponse.json(
          { error: magic.message ?? "Invalid file content." },
          { status: 400 }
        );
      }

      const runConvert = () => options.convert(buffer, file, formData);
      const outputBuffer = options.heavy
        ? await withHeavyJobGuard(runConvert)
        : await runConvert();

      const baseName = options.outputName
        ? options.outputName(file.name)
        : file.name.replace(/\.[^.]+$/, "");

      await logToolUsage({
        userId,
        sessionId: request.headers.get("x-session-id") || "anonymous",
        toolSlug: options.toolSlug,
        ipAddress: clientIpForLogs(request),
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
      const message = toSafeApiError(error, "Processing failed");

      await logError({
        user_id: userId,
        tool_name: options.toolSlug,
        error_type: "TOOL_ERROR",
        error_message: error instanceof Error ? error.message : message,
        stack_trace: error instanceof Error ? error.stack : undefined,
      }).catch(() => {});

      captureApiError(error, { route: `tools/${options.toolSlug}`, user_id: userId });

      return NextResponse.json({ error: message }, { status: 500 });
    }
  };

  return handler;
}

export const TOOL_MAX_DURATION = 60;
