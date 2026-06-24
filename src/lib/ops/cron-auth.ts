export function isCronAuthorized(
  authHeader: string | null,
  vercelCronHeader: string | null,
  cronSecret: string | undefined
): boolean {
  const secret = cronSecret?.trim();
  if (!secret) return false;
  if (authHeader === `Bearer ${secret}`) return true;
  if (vercelCronHeader === "1" && process.env.VERCEL === "1") return true;
  return false;
}
