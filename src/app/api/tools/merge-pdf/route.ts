import { beginToolRoute, handleToolRouteFailure } from "@/lib/server/tool-request-guards";
import { NextRequest, NextResponse } from "next/server";
import { toolJsonError } from "@/lib/server/tool-api-error";
import { mergePDFs } from "@/lib/services/pdf-merge.service";
import { resolvePdfBuffer } from "@/lib/pdf/pdf-password.server";
import { checkUsageLimit } from "@/lib/services/usage-limit.service";
import { resolveToolUserContext } from "@/lib/services/user-tool-context.service";
import { logToolUsage } from "@/lib/db/queries";
import { resolveMutationToolUser } from "@/lib/auth/tool-mutation-auth";
import { validateSingleUpload, uploadValidationResponse } from "@/lib/server/upload-validation";
import { FILE_LIMITS } from "@/config/constants";
import { getGuestUsageKey } from "@/lib/server/client-ip";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const early = await beginToolRoute(request, "merge-pdf");
  if (early) return early;

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const mutationAuth = await resolveMutationToolUser(request);
    if (mutationAuth.denied) return mutationAuth.denied;
    userId = mutationAuth.userId;

    const usageResult = await checkUsageLimit(userId, request, "merge-pdf");
    if (!usageResult.allowed) {
      return toolJsonError(request, usageResult.message ?? "Daily usage limit reached.", 429);
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
      return toolJsonError(request, "At least 2 PDF files are required", 400);
    }

    if (files.length > maxFiles) {
      return toolJsonError(request, `Maximum ${maxFiles} files allowed`, 400);
    }

    const rawBuffers: Buffer[] = [];
    for (const file of files) {
      const validated = await validateSingleUpload(file, ["pdf"], maxSizeMB);
      if (!validated.ok) {
        if (validated.error === "Invalid file type.") {
          return toolJsonError(request, `Invalid file type: ${file.name}. Only PDF files are accepted.`, 400);
        }
        return uploadValidationResponse(request, validated);
      }
      rawBuffers.push(validated.buffer);
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
        const raw = rawBuffers[index];
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
    await logToolUsage({
      userId,
      toolSlug: "merge-pdf",
      ipAddress: userId ? null : ipHash,
      fileSize: buffers.reduce((sum, b) => sum + b.length, 0),
      processingTimeMs: processingTime,
      status: "completed",
      inputFileNames: files.map((f) => f.name),
      output: {
        buffer: mergedPdf,
        fileName: "merged.pdf",
        mimeType: "application/pdf",
      },
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
    return handleToolRouteFailure(error, { request, 
      toolSlug: "merge-pdf",
      userId,
      errorType: "MERGE_ERROR",
      fallbackMessage: "Failed to merge PDFs",
    });
  }
}
