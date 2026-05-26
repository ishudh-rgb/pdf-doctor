import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { summarizePDF } from "@/lib/services/ai-summary.service";
import { checkAIUsageLimit } from "@/lib/services/usage-limit.service";
import { logToolUsage, logError } from "@/lib/db/queries";
import { getApiUser } from "@/lib/auth/get-api-user";
import { isValidFileType, validateFileSize } from "@/lib/utils/file";
import { FILE_LIMITS } from "@/config/constants";
import { isAIProviderConfigured } from "@/lib/ai/config";

export const maxDuration = 120;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to summarize PDF";
}

async function extractPdfText(buffer: Buffer, password?: string): Promise<{
  textContent: string;
  pageCount: number;
}> {
  const parser = new PDFParse({
    data: buffer,
    password: password || undefined,
  });

  try {
    const parsed = await parser.getText();
    return {
      textContent: parsed.text,
      pageCount: parsed.total,
    };
  } finally {
    await parser.destroy();
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const user = await getApiUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to use AI features." },
        { status: 401 }
      );
    }

    userId = user.id;

    const usageLimit = await checkAIUsageLimit(userId, user.plan);
    if (!usageLimit.allowed) {
      return NextResponse.json(
        { error: usageLimit.message || "Daily AI usage limit reached." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const provider = (formData.get("provider") as string) || "gemini";
    const pdfPassword = (formData.get("password") as string | null)?.trim() || undefined;

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (!isValidFileType(file, ["pdf"])) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are accepted." },
        { status: 400 }
      );
    }

    const maxSizeMB =
      user.plan === "pro" ? FILE_LIMITS.maxProFileSizeMB : FILE_LIMITS.maxFreeFileSizeMB;
    const sizeCheck = validateFileSize(file, maxSizeMB);
    if (!sizeCheck.valid) {
      return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let textContent = "";
    let pageCount = 0;

    try {
      const extracted = await extractPdfText(buffer, pdfPassword);
      textContent = extracted.textContent;
      pageCount = extracted.pageCount;
    } catch (error) {
      const message = getErrorMessage(error).toLowerCase();

      if (message.includes("password")) {
        return NextResponse.json(
          {
            error:
              "This PDF is password-protected. Unlock it first using the Unlock PDF tool, or enter the PDF password and try again.",
            code: "PDF_PASSWORD_REQUIRED",
          },
          { status: 400 }
        );
      }

      throw error;
    }

    if (!textContent || textContent.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from this PDF. The file may be image-based, scanned, or empty.",
        },
        { status: 400 }
      );
    }

    const summary = await summarizePDF(
      textContent,
      userId,
      provider as "gemini" | "openai"
    );

    const processingTime = Date.now() - startTime;
    const usedLocalSummary = !isAIProviderConfigured(provider as "gemini" | "openai");

    await logToolUsage({
      userId,
      sessionId: request.headers.get("x-session-id") || "anonymous",
      toolSlug: "ai-pdf-summarizer",
      ipAddress: request.headers.get("x-forwarded-for"),
      fileSize: buffer.length,
      processingTimeMs: processingTime,
      status: "completed",
    }).catch(() => {});

    return NextResponse.json({
      documentTitle: summary.documentTitle,
      topics: summary.topics ?? [],
      shortSummary: summary.shortSummary,
      detailedSummary: summary.detailedSummary,
      keyPoints: summary.keyPoints,
      actionItems: summary.actionItems,
      importantDates: summary.importantDates,
      metadata: {
        pageCount,
        characterCount: textContent.length,
        processingTimeMs: processingTime,
        mode: usedLocalSummary ? "local-fallback" : provider,
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    await logError({
      user_id: userId,
      tool_name: "ai-pdf-summarizer",
      error_type: "AI_SUMMARY_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});

    if (message.includes("usage limit") || message.includes("limit reached")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    if (
      message.includes("API key") ||
      message.includes("quota") ||
      message.includes("GEMINI_API_KEY") ||
      message.includes("OPENAI_API_KEY")
    ) {
      return NextResponse.json(
        {
          error:
            "AI service is not configured yet. Add GEMINI_API_KEY in .env.local and restart the server.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
