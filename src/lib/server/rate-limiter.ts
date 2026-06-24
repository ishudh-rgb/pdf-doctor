import type { NextRequest } from "next/server";
import { getTrustedClientIp } from "@/lib/server/client-ip";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function store(): Map<string, Bucket> {
  const g = globalThis as typeof globalThis & { __rateLimitBuckets?: Map<string, Bucket> };
  if (!g.__rateLimitBuckets) g.__rateLimitBuckets = buckets;
  return g.__rateLimitBuckets;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function checkRateLimit(
  request: NextRequest,
  options: {
    keyPrefix: string;
    maxRequests: number;
    windowMs: number;
    keySuffix?: string;
  }
): RateLimitResult {
  const ip = getTrustedClientIp(request);
  const key = `${options.keyPrefix}:${ip}${options.keySuffix ? `:${options.keySuffix}` : ""}`;
  const now = Date.now();
  const map = store();

  let bucket = map.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    map.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - bucket.count),
    retryAfterSec: 0,
  };
}

export function rateLimitResponse(retryAfterSec: number) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}

/** Auth endpoints: 10 attempts per 15 minutes per IP */
export function checkAuthRateLimit(request: NextRequest): RateLimitResult {
  return checkRateLimit(request, {
    keyPrefix: "auth",
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
}

/** Tool API: 60 requests per minute per IP */
export function checkToolRateLimit(
  request: NextRequest,
  toolSlug: string
): RateLimitResult {
  return checkRateLimit(request, {
    keyPrefix: "tool",
    keySuffix: toolSlug,
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
}
