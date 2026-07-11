/** HMAC secret for local-dev auth cookies (no Supabase). Never hardcode a real secret here. */

export function getLocalDevSessionSecret(): string {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) return cronSecret;

  const devSecret = process.env.LOCAL_DEV_SESSION_SECRET?.trim();
  if (devSecret) return devSecret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRON_SECRET is required in production for session signing and cron/health auth."
    );
  }

  return "__LOCAL_DEV_SESSION_SECRET_NOT_CONFIGURED__";
}
