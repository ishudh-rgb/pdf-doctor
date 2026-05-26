import crypto from "crypto";
import type { NextRequest } from "next/server";

export const LOCAL_DEV_SESSION_COOKIE = "pdf-doctor-dev-session";

function getSessionSecret(): string {
  return process.env.CRON_SECRET || "pdf-doctor-local-dev-secret";
}

export function createLocalDevSessionToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function parseLocalDevSessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const separator = decoded.lastIndexOf(".");
    if (separator === -1) return null;

    const payload = decoded.slice(0, separator);
    const signature = decoded.slice(separator + 1);
    const expected = crypto
      .createHmac("sha256", getSessionSecret())
      .update(payload)
      .digest("hex");

    if (signature !== expected) return null;

    const parsed = JSON.parse(payload) as { userId: string; exp: number };
    if (!parsed.userId || parsed.exp < Date.now()) return null;
    return parsed.userId;
  } catch {
    return null;
  }
}

export function getLocalDevUserIdFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get(LOCAL_DEV_SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseLocalDevSessionToken(token);
}
