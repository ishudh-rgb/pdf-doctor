import { NextRequest, NextResponse } from "next/server";
import { checkUsageLimit } from "@/lib/services/usage-limit.service";
import { resolveToolUserContext } from "@/lib/services/user-tool-context.service";
import { withHeavyJobGuard } from "@/lib/server/conversion-semaphore";
import { logToolUsage, logError } from "@/lib/db/queries";
import { resolveMutationToolUser } from "@/lib/auth/tool-mutation-auth";
import { isValidFileType, validateFileSize, sanitizeFilename } from "@/lib/utils/file";
import { getGuestUsageKey } from "@/lib/server/client-ip";
import { guardToolRateLimit, guardApiKeyRateLimit } from "@/lib/server/rate-limiter";
import { guardToolMutationOrigin } from "@/lib/server/mutation-origin";
import { toSafeApiError, captureApiError } from "@/lib/server/safe-error";
import { toolJsonError } from "@/lib/server/tool-api-error";
import { heavyJobCapacityResponse } from "@/lib/server/heavy-job-http";
import { authGuardResponse } from "@/lib/server/auth-guard-http";
import {
  isMaintenanceModeEnabled,
  MAINTENANCE_MESSAGE,
} from "@/lib/server/maintenance-mode";
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
      const originBlocked = guardToolMutationOrigin(request);
      if (originBlocked) {
        return toolJsonError(request, "Invalid request origin", 403);
      }

      if (await isMaintenanceModeEnabled()) {
        return toolJsonError(request, MAINTENANCE_MESSAGE, 503);
      }

      const toolRate = await guardToolRateLimit(request, options.toolSlug);
      if (toolRate) return toolRate;

      const apiKeyRate = await guardApiKeyRateLimit(request, options.toolSlug);
      if (apiKeyRate) return apiKeyRate;

      const mutationAuth = await resolveMutationToolUser(request);
      if (mutationAuth.denied) return mutationAuth.denied;
      userId = mutationAuth.userId;

      const userContext = await resolveToolUserContext(userId);
      const maxSizeMB = userContext.maxSizeMB;

      const usageResult = await checkUsageLimit(
        userId,
        getGuestUsageKey(request),
        options.toolSlug
      );
      if (!usageResult.allowed) {
        return toolJsonError(request, usageResult.message ?? "Daily usage limit reached.", 429);
      }

      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return toolJsonError(request, "File is required", 400);
      }

      if (!isValidFileType(file, options.allowedTypes)) {
        return toolJsonError(
          request,
          `Invalid file type for ${options.toolSlug}.`,
          400
        );
      }

      const sizeCheck = validateFileSize(file, maxSizeMB);
      if (!sizeCheck.valid) {
        return toolJsonError(request, sizeCheck.message ?? "File is too large.", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const magic = validateBufferMagic(buffer, options.allowedTypes);
      if (!magic.valid) {
        return toolJsonError(
          request,
          magic.message ?? "Invalid file content.",
          400
        );
      }

      const runConvert = () => options.convert(buffer, file, formData);
      const outputBuffer = options.heavy
        ? await withHeavyJobGuard(runConvert)
        : await runConvert();

      const baseName = options.outputName
        ? options.outputName(file.name)
        : file.name.replace(/\.[^.]+$/, "");
      const outputFileName = `${sanitizeFilename(baseName)}.${options.outputExtension}`;

      await logToolUsage({
        userId,
        sessionId: request.headers.get("x-session-id") || "anonymous",
        toolSlug: options.toolSlug,
        ipAddress: clientIpForLogs(request),
        fileSize: buffer.length,
        processingTimeMs: Date.now() - startTime,
        status: "completed",
        inputFileNames: [file.name],
        output: {
          buffer: outputBuffer,
          fileName: outputFileName,
          mimeType: options.contentType,
        },
      }).catch(() => {});

      return new NextResponse(new Uint8Array(outputBuffer), {
        status: 200,
        headers: {
          "Content-Type": options.contentType,
          "Content-Disposition": `attachment; filename="${outputFileName}"`,
          "Content-Length": String(outputBuffer.length),
        },
      });
    } catch (error) {
      const blocked = authGuardResponse(error);
      if (blocked) return blocked;

      const capacity = heavyJobCapacityResponse(error);
      if (capacity) return capacity;

      const message = toSafeApiError(error, "Processing failed");

      await logError({
        user_id: userId,
        tool_name: options.toolSlug,
        error_type: "TOOL_ERROR",
        error_message: error instanceof Error ? error.message : message,
        stack_trace: error instanceof Error ? error.stack : undefined,
      }).catch(() => {});

      captureApiError(error, { route: `tools/${options.toolSlug}`, user_id: userId });

      return toolJsonError(request, message, 500);
    }
  };

  return handler;
}

export const TOOL_MAX_DURATION = 60;
