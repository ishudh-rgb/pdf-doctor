import { beforeEach, describe, expect, it, vi } from "vitest";

describe("upstash-kv", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("reports when Upstash env is missing", async () => {
    const mod = await import("@/lib/server/upstash-kv");
    expect(mod.isUpstashConfigured()).toBe(false);
    await expect(mod.getUpstashRedis()).resolves.toBeNull();
  });

  it("returns null for kv helpers without redis", async () => {
    const mod = await import("@/lib/server/upstash-kv");
    await expect(mod.upstashGetJson("key")).resolves.toBeNull();
    await expect(mod.upstashSetJson("key", { ok: true }, 60)).resolves.toBe(false);
    await expect(mod.upstashDel("key")).resolves.toBeUndefined();
  });
});
