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
});
