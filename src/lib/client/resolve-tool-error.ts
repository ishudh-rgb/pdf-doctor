import type { Language } from "@/types";

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

const PATTERN_KEYS: Array<{ test: RegExp; key: string; vars?: (m: RegExpMatchArray) => Record<string, string | number> }> = [
  { test: /file is empty/i, key: "errors.emptyFile" },
  { test: /too large|exceeds the maximum|maximum allowed size of (\d+)/i, key: "errors.fileTooBig", vars: (m) => ({ size: m[1] ?? "25" }) },
  { test: /invalid file type|does not match the allowed|not accepted/i, key: "errors.invalidFileType" },
  { test: /password protected|password is required|wrong password|incorrect password/i, key: "errors.passwordProtected" },
  { test: /corrupted|invalid pdf|could not read pdf/i, key: "errors.corruptedPdf" },
  { test: /session expired|re-upload/i, key: "errors.sessionExpired" },
  { test: /too many requests|rate limit/i, key: "errors.rateLimited" },
  { test: /daily limit|usage limit|limit reached/i, key: "errors.fileLimitReached", vars: () => ({ count: "5" }) },
  { test: /processing failed|could not render|conversion failed/i, key: "errors.processingFailed" },
  { test: /network|not reachable|failed to fetch/i, key: "errors.networkError" },
  { test: /timed out|timeout/i, key: "errors.processingFailed" },
  { test: /maintenance/i, key: "errors.maintenanceMode" },
  { test: /log in|authentication required/i, key: "errors.loginRequired" },
  { test: /permission|access denied|unauthorized/i, key: "errors.unauthorized" },
  { test: /ai summarization is temporarily unavailable|ai service is temporarily unavailable/i, key: "errors.processingFailed" },
];

export type ToolErrorPayload = {
  error?: string;
  correlationId?: string;
  code?: string;
};

function matchErrorKey(message: string): { key: string; vars?: Record<string, string | number> } | null {
  for (const entry of PATTERN_KEYS) {
    const m = message.match(entry.test);
    if (m) {
      return { key: entry.key, vars: entry.vars?.(m) };
    }
  }
  return null;
}

/** Map API / client errors to i18n keys; append correlation ref for server errors. */
export function resolveToolApiError(
  payload: string | ToolErrorPayload | null | undefined,
  t: TranslateFn,
  locale: Language,
  fallbackKey = "errors.generic"
): string {
  const message =
    typeof payload === "string"
      ? payload
      : payload?.error?.trim() || "";
  const correlationId =
    typeof payload === "object" && payload ? payload.correlationId : undefined;

  if (!message) {
    return t(fallbackKey);
  }

  const mapped = matchErrorKey(message);
  const text = mapped ? t(mapped.key, mapped.vars) : locale === "hi" ? t(fallbackKey) : message;

  if (correlationId && /temporarily unavailable|something went wrong|processing failed|server error/i.test(text)) {
    return `${text} (ref: ${correlationId.slice(0, 8)})`;
  }

  return text;
}

export function resolveClientToolError(
  err: unknown,
  t: TranslateFn,
  locale: Language,
  options?: { timeoutKey?: string; networkKey?: string }
): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return t(options?.timeoutKey ?? "errors.processingFailed");
  }
  if (err instanceof TypeError && /failed to fetch/i.test(err.message)) {
    return t(options?.networkKey ?? "errors.networkError");
  }
  if (err instanceof Error) {
    return resolveToolApiError(err.message, t, locale);
  }
  return t("errors.generic");
}
