import { getAIProvider, type AISummaryResult } from "@/lib/ai/provider";
import { createLocalSummary } from "@/lib/ai/local-summary";
import { isAIProviderConfigured } from "@/lib/ai/config";
import { isLocalDevAuthEnabled } from "@/lib/auth/auth-config";
import { logAIUsage, logError } from "@/lib/db/queries";
import { preprocessDocumentText, sanitizeSummaryResult } from "@/lib/ai/sanitize-summary";

export type { AISummaryResult };

export async function summarizePDF(
  text: string,
  userId: string,
  provider: "gemini" | "openai" = "gemini"
): Promise<AISummaryResult> {
  const cleanedText = preprocessDocumentText(text);

  if (!cleanedText || cleanedText.trim().length === 0) {
    throw new Error("No text content to summarize.");
  }

  if (!isAIProviderConfigured(provider)) {
    if (isLocalDevAuthEnabled() || process.env.NODE_ENV === "development") {
      return sanitizeSummaryResult(createLocalSummary(cleanedText), cleanedText);
    }

    throw new Error(
      provider === "gemini"
        ? "GEMINI_API_KEY is not configured."
        : "OPENAI_API_KEY is not configured."
    );
  }

  const aiProvider = getAIProvider(provider);

  try {
    const { result, usage } = await aiProvider.summarize(cleanedText);

    await logAIUsage({
      user_id: userId,
      tool_name: "ai-pdf-summarizer",
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      estimated_cost: usage.estimatedCost,
      provider,
      model: usage.model,
      status: "success",
    }).catch(() => {});

    return sanitizeSummaryResult(result, cleanedText);
  } catch (err) {
    await logAIUsage({
      user_id: userId,
      tool_name: "ai-pdf-summarizer",
      provider,
      status: "failed",
    }).catch(() => {});

    await logError({
      user_id: userId,
      tool_name: "ai-pdf-summarizer",
      error_type: "AI_SUMMARY_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    }).catch(() => {});

    if (isLocalDevAuthEnabled() || process.env.NODE_ENV === "development") {
      return sanitizeSummaryResult(createLocalSummary(cleanedText), cleanedText);
    }

    throw new Error(
      `AI summarization failed: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
