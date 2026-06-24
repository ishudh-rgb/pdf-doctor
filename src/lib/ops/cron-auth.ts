export function isCronAuthorized(
  authHeader: string | null,
  querySecret: string | null,
  vercelCronHeader: string | null,
  cronSecret: string | undefined
): boolean {
  const secret = cronSecret?.trim();
  if (!secret) return false;
  if (authHeader === `Bearer ${secret}`) return true;
  if (querySecret === secret) return true;
  if (vercelCronHeader === "1") return true;
  return false;
}
