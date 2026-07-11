import { describe, expect, it, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  guardMutationOrigin,
  isMutationOriginAllowed,
} from "@/lib/server/mutation-origin";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mutation origin guard", () => {
  it("allows all origins in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const request = new NextRequest("http://localhost/api/user/account", {
      method: "DELETE",
      headers: { origin: "https://evil.example" },
    });
    expect(isMutationOriginAllowed(request)).toBe(true);
    expect(guardMutationOrigin(request)).toBeNull();
  });

  it("blocks cross-site mutations in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://onlymypdf.com");

    const request = new NextRequest("https://onlymypdf.com/api/user/account", {
      method: "DELETE",
      headers: { origin: "https://evil.example" },
    });

    expect(isMutationOriginAllowed(request)).toBe(false);
    const blocked = guardMutationOrigin(request);
    expect(blocked?.status).toBe(403);
    const body = await blocked!.json();
    expect(body.error).toMatch(/origin/i);
  });

  it("allows same-site origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://onlymypdf.com");

    const request = new NextRequest("https://onlymypdf.com/api/user/account", {
      method: "DELETE",
      headers: { origin: "https://onlymypdf.com" },
    });

    expect(isMutationOriginAllowed(request)).toBe(true);
    expect(guardMutationOrigin(request)).toBeNull();
  });
});
