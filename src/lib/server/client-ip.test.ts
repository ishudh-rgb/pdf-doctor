import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("client-ip", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, IP_HASH_SALT: "test-salt" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  async function loadModule() {
    return import("@/lib/server/client-ip");
  }

  it("prefers x-real-ip then cf-connecting-ip", async () => {
    const { getTrustedClientIp } = await loadModule();
    const vercelReq = new NextRequest("https://onlymypdf.com/", {
      headers: { "x-real-ip": "  203.0.113.5  " },
    });
    expect(getTrustedClientIp(vercelReq)).toBe("203.0.113.5");

    const cfReq = new NextRequest("https://onlymypdf.com/", {
      headers: { "cf-connecting-ip": "198.51.100.2" },
    });
    expect(getTrustedClientIp(cfReq)).toBe("198.51.100.2");
  });

  it("uses forwarded-for in development and unknown in production", async () => {
    const { getTrustedClientIp } = await loadModule();

    vi.stubEnv("NODE_ENV", "development");
    const devReq = new NextRequest("https://onlymypdf.com/", {
      headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2" },
    });
    expect(getTrustedClientIp(devReq)).toBe("10.0.0.1");

    vi.stubEnv("NODE_ENV", "production");
    const prodReq = new NextRequest("https://onlymypdf.com/");
    expect(getTrustedClientIp(prodReq)).toBe("unknown");

    vi.stubEnv("NODE_ENV", "development");
    const devFallbackReq = new NextRequest("https://onlymypdf.com/");
    expect(getTrustedClientIp(devFallbackReq)).toBe("127.0.0.1");
  });

  it("hashes guest usage keys deterministically", async () => {
    const { hashClientIp, getGuestUsageKey } = await loadModule();
    expect(hashClientIp("203.0.113.5")).toHaveLength(32);
    expect(hashClientIp("203.0.113.5")).toBe(hashClientIp("203.0.113.5"));

    const req = new NextRequest("https://onlymypdf.com/", {
      headers: { "x-real-ip": "203.0.113.5" },
    });
    expect(getGuestUsageKey(req)).toBe(hashClientIp("203.0.113.5"));
  });
});
