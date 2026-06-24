import type { NextRequest } from "next/server";
import { getGuestUsageKey } from "@/lib/server/client-ip";

export function resolveJobOwnerKey(
  request: NextRequest,
  userId: string | null
): string {
  if (userId) return `user:${userId}`;
  const sessionId = request.headers.get("x-session-id")?.trim() || "anonymous";
  return `guest:${getGuestUsageKey(request)}:${sessionId}`;
}

export function assertJobOwner(
  jobOwnerKey: string | undefined,
  requestOwnerKey: string
): boolean {
  return !!jobOwnerKey && jobOwnerKey === requestOwnerKey;
}
