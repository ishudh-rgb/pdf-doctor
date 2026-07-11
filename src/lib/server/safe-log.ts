/** Safe server logging — never emit emails, passwords, tokens, or full error objects. */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_RE = /bearer\s+[a-z0-9._-]+/gi;
const JWT_RE = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

export const REDACTED = "[REDACTED]";

export function redactSensitiveText(value: string): string {
  return value
    .replace(EMAIL_RE, REDACTED)
    .replace(BEARER_RE, `bearer ${REDACTED}`)
    .replace(JWT_RE, REDACTED);
}

export function safeErrorMessage(error: unknown, maxLen = 200): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";
  const trimmed = raw.trim().slice(0, maxLen);
  return redactSensitiveText(trimmed) || "Unknown error";
}

/** Log an operational error without dumping stacks or request bodies. */
export function logSafeError(context: string, error: unknown): void {
  console.error(`[${context}]`, safeErrorMessage(error));
}

/** Log a short dev-only note — caller must not pass PII in `detail`. */
export function logDevNote(context: string, detail?: Record<string, string | number | boolean>): void {
  if (process.env.NODE_ENV !== "development") return;
  if (detail) {
    console.log(`[${context}]`, detail);
    return;
  }
  console.log(`[${context}]`);
}
