import type { NextRequest } from "next/server";
import { getToolRequestUserId } from "@/lib/auth/get-tool-request-user";
import { getGuestUsageKey } from "@/lib/server/client-ip";
import { getGuestSessionIdFromRequest } from "@/lib/privacy/guest-session";

export function resolveJobOwnerKey(
  request: NextRequest,
  userId: string | null
): string {
  if (userId) return `user:${userId}`;
  const sessionId = getGuestSessionIdFromRequest(request) || "anonymous";
  return `guest:${getGuestUsageKey(request)}:${sessionId}`;
}

/** Same owner key resolution for POST, status poll, and download. */
export async function resolveToolJobOwnerKey(
  request: NextRequest
): Promise<string> {
  const userId = await getToolRequestUserId();
  return resolveJobOwnerKey(request, userId);
}

export function assertJobOwner(
  jobOwnerKey: string | undefined,
  requestOwnerKey: string
): boolean {
  return !!jobOwnerKey && jobOwnerKey === requestOwnerKey;
}
