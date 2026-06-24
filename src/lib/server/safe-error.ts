const SAFE_MESSAGES = new Set([
  "Authentication required",
  "Access denied",
  "File not found",
  "Daily usage limit reached.",
  "Too many requests. Please try again later.",
  "Payment verification failed",
  "Invalid or expired coupon code",
]);

/** Return a client-safe error string — never leak paths, stack, or library internals. */
export function toSafeApiError(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (SAFE_MESSAGES.has(msg)) return msg;
    if (msg.length < 120 && !msg.includes("\\") && !msg.includes("/tmp")) {
      if (
        /^(Invalid|Missing|Failed to|Password|Daily|Maximum|At least|File|PDF|Upload)/i.test(
          msg
        )
      ) {
        return msg;
      }
    }
  }
  return fallback;
}
