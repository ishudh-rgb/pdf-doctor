/** Production secret checks — wired via instrumentation.ts on server boot. */

const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "IP_HASH_SALT",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
] as const;

const PLACEHOLDER_MARKERS = ["your_", "placeholder", "change_me", "change_this"];

function isMissingOrPlaceholder(val: string | undefined): boolean {
  if (!val?.trim()) return true;
  const lower = val.toLowerCase();
  return PLACEHOLDER_MARKERS.some((m) => lower.includes(m));
}

export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_IN_PRODUCTION.filter((key) =>
    isMissingOrPlaceholder(process.env[key])
  );

  const upstashMissing =
    isMissingOrPlaceholder(process.env.UPSTASH_REDIS_REST_URL) ||
    isMissingOrPlaceholder(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (missing.length > 0) {
    throw new Error(`Missing production secrets: ${missing.join(", ")}`);
  }

  if (upstashMissing) {
    console.warn(
      "[pdf-doctor] UPSTASH_REDIS_* not set — rate limits use per-instance memory (not recommended for production scale)."
    );
  }
}

export function isProductionReady(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  try {
    assertProductionSecrets();
    return true;
  } catch {
    return false;
  }
}

export function requireIpHashSalt(): string {
  const salt = process.env.IP_HASH_SALT;
  if (process.env.NODE_ENV === "production") {
    if (isMissingOrPlaceholder(salt)) {
      throw new Error("IP_HASH_SALT must be set in production");
    }
    return salt!;
  }
  return salt?.trim() || "onlymypdf-dev-ip-salt";
}
