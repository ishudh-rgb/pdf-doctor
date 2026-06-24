import type { NextRequest } from "next/server";

export const GUEST_SESSION_COOKIE = "pd_guest_session";

export function getGuestSessionIdFromRequest(request: NextRequest): string | null {
  const fromCookie = request.cookies.get(GUEST_SESSION_COOKIE)?.value?.trim();
  if (fromCookie) return fromCookie;
  return request.headers.get("x-session-id")?.trim() || null;
}
