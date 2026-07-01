import { describe, expect, it, vi } from "vitest";

describe("withHeavyJobGuard (local fallback)", () => {
  it("runs the wrapped function and releases the slot", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { withHeavyJobGuard } = await import("@/lib/server/conversion-semaphore");
    const fn = vi.fn(async () => "done");

    const result = await withHeavyJobGuard(fn);

    expect(result).toBe("done");
    expect(fn).toHaveBeenCalledOnce();
  });

  it("rejects in production when Upstash is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { withHeavyJobGuard, HeavyJobCapacityError } = await import(
      "@/lib/server/conversion-semaphore"
    );

    await expect(withHeavyJobGuard(async () => "x")).rejects.toBeInstanceOf(
      HeavyJobCapacityError
    );
  });
});

describe("isDistributedSemaphoreEnabled", () => {
  it("is true when Upstash env vars are set", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    const { isDistributedSemaphoreEnabled } = await import("@/lib/server/upstash-semaphore");
    expect(isDistributedSemaphoreEnabled()).toBe(true);
  });
});
