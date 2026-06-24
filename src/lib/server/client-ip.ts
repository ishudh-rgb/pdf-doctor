import type { NextRequest } from "next/server";
import crypto from "crypto";

/**
 * Client IP from platform-trusted headers only (Vercel, Cloudflare).
 * Do not trust raw X-Forwarded-For from clients on untrusted hosts.
 */
export function getTrustedClientIp(request: NextRequest): string {
  const vercelIp = request.headers.get("x-real-ip");
  if (vercelIp?.trim()) return vercelIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();

  if (process.env.NODE_ENV === "development") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() || "127.0.0.1";
    return "127.0.0.1";
  }

  return "unknown";
}

export function hashClientIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "onlymypdf-ip-salt";
  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

export function getGuestUsageKey(request: NextRequest): string {
  return hashClientIp(getTrustedClientIp(request));
}
