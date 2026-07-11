import type { NextRequest } from "next/server";
import { extractApiKeyFromRequest, hashApiKey } from "@/lib/auth/api-key-auth";
import { buildRateLimitMessage, type RateLimitScope } from "@/lib/rate-limit-message";
import { getTrustedClientIp } from "@/lib/server/client-ip";
import { CORRELATION_ID_HEADER, getCorrelationId } from "@/lib/server/correlation-id";

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

function memoryRateLimit(
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

const upstashLimiters = new Map<
  string,
  { limit: (key: string) => Promise<{ success: boolean; reset: number }> }
>();

async function getUpstashLimiter(maxRequests: number, windowSec: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const cacheKey = `${maxRequests}:${windowSec}`;
  const cached = upstashLimiters.get(cacheKey);
  if (cached) return cached;

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url, token });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
    prefix: `pdf-doctor:${cacheKey}`,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

export async function checkRateLimit(
  request: NextRequest,
  options: {
    keyPrefix: string;
    maxRequests: number;
    windowMs: number;
    keySuffix?: string;
  }
): Promise<RateLimitResult> {
  const ip = getTrustedClientIp(request);
  const key = `${options.keyPrefix}:${ip}${options.keySuffix ? `:${options.keySuffix}` : ""}`;
  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));

  try {
    const limiter = await getUpstashLimiter(options.maxRequests, windowSec);
    if (limiter) {
      const result = await limiter.limit(key);
      if (!result.success) {
        const retryAfterSec = Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000)
        );
        return { allowed: false, remaining: 0, retryAfterSec };
      }
      return { allowed: true, remaining: 0, retryAfterSec: 0 };
    }

    if (process.env.NODE_ENV === "production") {
      console.error("[rate-limit] Upstash unavailable in production — denying request");
      return { allowed: false, remaining: 0, retryAfterSec: 60 };
    }
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      console.error("[rate-limit] Upstash error in production:", err);
      return { allowed: false, remaining: 0, retryAfterSec: 60 };
    }
  }

  return memoryRateLimit(request, options);
}

export function rateLimitResponse(
  retryAfterSec: number,
  request?: NextRequest,
  scope: RateLimitScope = "generic"
) {
  const correlationId = getCorrelationId(request);
  const error = buildRateLimitMessage(scope, retryAfterSec, "en");
  return new Response(
    JSON.stringify({
      error,
      correlationId,
      retryAfterSec,
      rateLimitScope: scope,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
        [CORRELATION_ID_HEADER]: correlationId,
      },
    }
  );
}

/** Login / signup: 5 attempts per minute per IP */
export async function checkLoginRateLimit(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, {
    keyPrefix: "auth-login",
    maxRequests: 5,
    windowMs: 60 * 1000,
  });
}

/** Password reset + OTP: 3 attempts per hour per IP */
export async function checkPasswordResetRateLimit(
  request: NextRequest
): Promise<RateLimitResult> {
  return checkRateLimit(request, {
    keyPrefix: "auth-password-reset",
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  });
}

/** Other auth mutations (OAuth, MFA, logout): 10 per 15 minutes per IP */
export async function checkAuthRateLimit(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, {
    keyPrefix: "auth",
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
}

/** Tool API: 60 requests per minute per IP */
export async function checkToolRateLimit(
  request: NextRequest,
  toolSlug: string
): Promise<RateLimitResult> {
  return checkRateLimit(request, {
    keyPrefix: "tool",
    keySuffix: toolSlug,
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
}

/** Admin API: 40 requests per 15 minutes per IP */
export async function checkAdminRateLimit(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, {
    keyPrefix: "admin",
    maxRequests: 40,
    windowMs: 15 * 60 * 1000,
  });
}

/** PDF helper routes (previews/meta): 30 requests per minute per IP */
export async function checkPdfHelperRateLimit(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, {
    keyPrefix: "pdf-helper",
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
}

export async function guardToolRateLimit(
  request: NextRequest,
  toolSlug: string
): Promise<Response | null> {
  const toolRate = await checkToolRateLimit(request, toolSlug);
  if (!toolRate.allowed) return rateLimitResponse(toolRate.retryAfterSec);
  return null;
}

export async function guardPdfHelperRateLimit(request: NextRequest): Promise<Response | null> {
  const rate = await checkPdfHelperRateLimit(request);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);
  return null;
}

export async function guardAdminRateLimit(request: NextRequest): Promise<Response | null> {
  const rate = await checkAdminRateLimit(request);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);
  return null;
}

/** General API routes (files, user, privacy): 120 requests per 15 minutes per IP */
export async function checkGeneralApiRateLimit(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, {
    keyPrefix: "api",
    maxRequests: 120,
    windowMs: 15 * 60 * 1000,
  });
}

export async function guardGeneralApiRateLimit(request: NextRequest): Promise<Response | null> {
  const rate = await checkGeneralApiRateLimit(request);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);
  return null;
}

/** Razorpay webhooks: cap unsigned/signed flood per IP before HMAC verification. */
export async function checkWebhookRateLimit(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, {
    keyPrefix: "webhook",
    maxRequests: 200,
    windowMs: 60 * 1000,
  });
}

export async function guardWebhookRateLimit(request: NextRequest): Promise<Response | null> {
  const rate = await checkWebhookRateLimit(request);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);
  return null;
}

/** Per-API-key bucket: 120 tool mutations per minute (when x-api-key / Bearer omp_* present). */
export async function guardApiKeyRateLimit(
  request: NextRequest,
  toolSlug: string
): Promise<Response | null> {
  const raw = extractApiKeyFromRequest(request);
  if (!raw) return null;

  const keySuffix = `${hashApiKey(raw).slice(0, 20)}:${toolSlug}`;
  const rate = await checkRateLimit(request, {
    keyPrefix: "api-key",
    keySuffix,
    maxRequests: 120,
    windowMs: 60 * 1000,
  });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);
  return null;
}
