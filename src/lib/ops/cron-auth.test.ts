import { describe, expect, it, vi, afterEach } from "vitest";
import { isCronAuthorized } from "./cron-auth";

describe("isCronAuthorized", () => {
  const secret = "test-secret";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts bearer token", () => {
    expect(isCronAuthorized(`Bearer ${secret}`, null, secret)).toBe(true);
  });

  it("accepts vercel cron header on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    expect(isCronAuthorized(null, "1", secret)).toBe(true);
  });

  it("rejects vercel cron header off Vercel", () => {
    vi.stubEnv("VERCEL", undefined);
    expect(isCronAuthorized(null, "1", secret)).toBe(false);
  });

  it("rejects missing secret", () => {
    expect(isCronAuthorized(`Bearer ${secret}`, null, undefined)).toBe(false);
  });
});
