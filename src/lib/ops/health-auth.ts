import type { NextRequest } from "next/server";

/** Authorize detailed health diagnostics (Bearer CRON_SECRET or x-health-key header). */
export function isHealthDetailAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const healthKey = request.headers.get("x-health-key");
  return healthKey === secret;
}
