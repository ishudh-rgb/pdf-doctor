import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const CORE_SECRETS = {
  NEXT_PUBLIC_APP_URL: "https://onlymypdf.in",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon",
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service",
  CRON_SECRET: "cron-secret-value",
  IP_HASH_SALT: "ip-hash-salt-value",
  UPSTASH_REDIS_REST_URL: "https://upstash.example.com",
  UPSTASH_REDIS_REST_TOKEN: "upstash-token-value",
  SENTRY_DSN: "https://sentry.example.com/1",
  RESEND_API_KEY: "re_test_key",
} as const;

const RAZORPAY_SECRETS = {
  NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_public",
  RAZORPAY_KEY_ID: "rzp_test",
  RAZORPAY_KEY_SECRET: "razorpay_secret",
  RAZORPAY_WEBHOOK_SECRET: "webhook_secret",
} as const;

describe("env-security", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    process.env = { ...env, ...CORE_SECRETS };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = env;
  });

  it("rejects BILLING_MODE=mock in production", async () => {
    process.env.BILLING_MODE = "mock";
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    const { assertProductionSecrets, isProductionReady } = await import(
      "@/lib/config/env-security"
    );

    expect(() => assertProductionSecrets()).toThrow(/BILLING_MODE=mock is not allowed/);
    expect(isProductionReady()).toBe(false);
  });

  it("allows BILLING_MODE=mock outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.BILLING_MODE = "mock";
    delete process.env.RAZORPAY_KEY_ID;

    const { assertProductionSecrets } = await import("@/lib/config/env-security");

    expect(() => assertProductionSecrets()).not.toThrow();
  });

  it("requires Razorpay webhook secret when billing is live", async () => {
    process.env.BILLING_MODE = "live";
    Object.assign(process.env, RAZORPAY_SECRETS);
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    const { assertProductionSecrets, getProductionRequiredSecretKeys } = await import(
      "@/lib/config/env-security"
    );

    expect(getProductionRequiredSecretKeys()).toContain("RAZORPAY_WEBHOOK_SECRET");
    expect(() => assertProductionSecrets()).toThrow(/RAZORPAY_WEBHOOK_SECRET/);
  });

  it("passes when live billing and all Razorpay keys are set", async () => {
    process.env.BILLING_MODE = "live";
    Object.assign(process.env, RAZORPAY_SECRETS);

    const { assertProductionSecrets, isProductionReady } = await import(
      "@/lib/config/env-security"
    );

    expect(() => assertProductionSecrets()).not.toThrow();
    expect(isProductionReady()).toBe(true);
  });

  it("skips checks outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.CRON_SECRET;

    const { assertProductionSecrets, isProductionReady } = await import(
      "@/lib/config/env-security"
    );

    expect(() => assertProductionSecrets()).not.toThrow();
    expect(isProductionReady()).toBe(true);
  });
});

describe("payment.service verifyWebhookSignature", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = env;
  });

  it("accepts mock_webhook only in mock billing mode", async () => {
    process.env.BILLING_MODE = "mock";
    const { verifyWebhookSignature } = await import("@/lib/services/payment.service");
    expect(verifyWebhookSignature("{}", "mock_webhook")).toBe(true);
    expect(verifyWebhookSignature("{}", "real_sig")).toBe(false);
  });

  it("rejects webhooks in production live mode without webhook secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.BILLING_MODE = "live";
    process.env.RAZORPAY_KEY_SECRET = "key_secret";
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    const { verifyWebhookSignature } = await import("@/lib/services/payment.service");
    expect(verifyWebhookSignature("{}", "some_signature")).toBe(false);
  });
});
