import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

describe("memory rate limiting", () => {
  it("blocks after max requests from same IP", async () => {
    const { guardGeneralApiRateLimit } = await import("@/lib/server/rate-limiter");

    const request = new NextRequest("http://localhost/api/test", {
      headers: { "x-real-ip": "203.0.113.50" },
    });

    let lastStatus: Response | null = null;
    for (let i = 0; i < 125; i++) {
      lastStatus = await guardGeneralApiRateLimit(request);
    }

    expect(lastStatus).not.toBeNull();
    expect(lastStatus?.status).toBe(429);
  });

  it("returns retry-after on rate limit responses", async () => {
    const { rateLimitResponse } = await import("@/lib/server/rate-limiter");
    const response = rateLimitResponse(42);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    const body = await response.json();
    expect(body.error).toMatch(/too many requests/i);
  });

  it("allows tool requests under the per-minute cap", async () => {
    const { guardToolRateLimit } = await import("@/lib/server/rate-limiter");
    const request = new NextRequest("http://localhost/api/tools/merge-pdf", {
      headers: { "x-real-ip": "198.51.100.99" },
    });
    await expect(guardToolRateLimit(request, "merge-pdf")).resolves.toBeNull();
  });

  it("blocks tool requests after the per-minute cap", async () => {
    const { guardToolRateLimit } = await import("@/lib/server/rate-limiter");
    const request = new NextRequest("http://localhost/api/tools/split-pdf", {
      headers: { "x-real-ip": "198.51.100.100" },
    });

    let blocked: Response | null = null;
    for (let i = 0; i < 65; i++) {
      blocked = await guardToolRateLimit(request, "split-pdf");
    }

    expect(blocked?.status).toBe(429);
  });

  it("skips api-key rate limit when no key is present", async () => {
    const { guardApiKeyRateLimit } = await import("@/lib/server/rate-limiter");
    const request = new NextRequest("http://localhost/api/tools/merge-pdf", {
      headers: { "x-real-ip": "203.0.113.77" },
    });
    await expect(guardApiKeyRateLimit(request, "merge-pdf")).resolves.toBeNull();
  });

  it("blocks webhook requests after the per-minute cap", async () => {
    const { guardWebhookRateLimit } = await import("@/lib/server/rate-limiter");
    const request = new NextRequest("http://localhost/api/payments/webhook", {
      headers: { "x-real-ip": "203.0.113.88" },
    });

    let blocked: Response | null = null;
    for (let i = 0; i < 205; i++) {
      blocked = await guardWebhookRateLimit(request);
    }

    expect(blocked?.status).toBe(429);
  });

  it("allows pdf helper routes under the cap", async () => {
    const { guardPdfHelperRateLimit } = await import("@/lib/server/rate-limiter");
    const request = new NextRequest("http://localhost/api/pdf/preview", {
      headers: { "x-real-ip": "203.0.113.89" },
    });
    await expect(guardPdfHelperRateLimit(request)).resolves.toBeNull();
  });

  it("allows admin routes under the cap", async () => {
    const { guardAdminRateLimit } = await import("@/lib/server/rate-limiter");
    const request = new NextRequest("http://localhost/api/admin/users", {
      headers: { "x-real-ip": "203.0.113.90" },
    });
    await expect(guardAdminRateLimit(request)).resolves.toBeNull();
  });

  it("allows auth routes under the cap", async () => {
    const { checkAuthRateLimit } = await import("@/lib/server/rate-limiter");
    const request = new NextRequest("http://localhost/api/auth/login", {
      headers: { "x-real-ip": "203.0.113.91" },
    });
    const result = await checkAuthRateLimit(request);
    expect(result.allowed).toBe(true);
  });
});
