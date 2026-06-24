/** Production secret checks — import from API routes or server bootstrap. */

const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
] as const;

export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => {
    const val = process.env[key];
    return !val || val.includes("your_") || val.includes("placeholder");
  });

  if (missing.length > 0) {
    throw new Error(`Missing production secrets: ${missing.join(", ")}`);
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
