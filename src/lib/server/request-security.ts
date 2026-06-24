import type { NextRequest } from "next/server";
import { buildOwnerHash } from "@/lib/pdf/pdf-session-store";
import { getGuestUsageKey } from "@/lib/server/client-ip";

/** Stable owner identity for PDF sessions — uses trusted IP for guests. */
export function ownerHashFromRequest(
  request: NextRequest,
  userId: string | null
): string {
  if (userId) return buildOwnerHash(userId, null);
  return buildOwnerHash(null, getGuestUsageKey(request));
}

/** Hashed IP for usage logs (never store raw IP). */
export function clientIpForLogs(request: NextRequest): string {
  return getGuestUsageKey(request);
}
