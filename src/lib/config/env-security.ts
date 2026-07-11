/** Production secret checks — wired via instrumentation.ts on server boot. */

import { isMockBillingMode } from "@/lib/billing/billing-config";

/** Required for every production deploy (mock or live billing). */
const CORE_REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "IP_HASH_SALT",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "SENTRY_DSN",
  "RESEND_API_KEY",
] as const;

/** Required only when BILLING_MODE is live (real Razorpay checkout). */
const LIVE_BILLING_REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
] as const;

const RECOMMENDED_IN_PRODUCTION = ["CONVERTAPI_SECRET"] as const;

const PLACEHOLDER_MARKERS = ["your_", "placeholder", "change_me", "change_this"];

function isMissingOrPlaceholder(val: string | undefined): boolean {
  if (!val?.trim()) return true;
  const lower = val.toLowerCase();
  return PLACEHOLDER_MARKERS.some((m) => lower.includes(m));
}

function missingKeys(keys: readonly string[]): string[] {
  return keys.filter((key) => isMissingOrPlaceholder(process.env[key]));
}

export function getProductionRequiredSecretKeys(): readonly string[] {
  if (isMockBillingMode()) {
    return CORE_REQUIRED_IN_PRODUCTION;
  }
  return [...CORE_REQUIRED_IN_PRODUCTION, ...LIVE_BILLING_REQUIRED_IN_PRODUCTION];
}

function assertMockBillingNotInProduction(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (isMockBillingMode()) {
    throw new Error(
      "BILLING_MODE=mock is not allowed in production. Set BILLING_MODE=live and configure Razorpay keys."
    );
  }
}

export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== "production") return;

  assertMockBillingNotInProduction();

  const missing = missingKeys(getProductionRequiredSecretKeys());

  if (missing.length > 0) {
    throw new Error(
      `Missing production secrets: ${missing.join(", ")} (live billing — configure all Razorpay keys)`
    );
  }

  const missingRecommended = missingKeys(RECOMMENDED_IN_PRODUCTION);
  if (missingRecommended.length > 0) {
    console.warn(
      `[env-security] Recommended production secrets not set: ${missingRecommended.join(", ")}`
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
