const ALLOWED_NEXT_PREFIXES = [
  "/dashboard",
  "/reset-password",
  "/pricing",
] as const;

const NEXT_PATH_ALIASES: Record<string, string> = {
  "/account": "/dashboard",
  "/settings": "/dashboard/settings",
};

const BLOCKED_NEXT_PATHS = new Set(["/dashboard/billing"]);

/** Reject open redirects; only allow same-origin relative paths on an allowlist. */
export function resolveSafeNextPath(next: string | null, fallback = "/dashboard"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }

  if (BLOCKED_NEXT_PATHS.has(next)) {
    return fallback;
  }

  const normalized = NEXT_PATH_ALIASES[next] ?? next;

  const allowed = ALLOWED_NEXT_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );

  return allowed ? normalized : fallback;
}
