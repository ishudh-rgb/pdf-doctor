import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/maintenance-mode", () => ({
  isMaintenanceModeEnabled: vi.fn(),
  MAINTENANCE_MESSAGE: "Maintenance",
}));

vi.mock("@/lib/server/rate-limiter", () => ({
  guardToolRateLimit: vi.fn(),
  guardApiKeyRateLimit: vi.fn(),
}));

vi.mock("@/lib/server/mutation-origin", () => ({
  guardToolMutationOrigin: vi.fn(),
}));

vi.mock("@/lib/server/heavy-job-http", () => ({
  heavyJobCapacityResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth-guard-http", () => ({
  authGuardResponse: vi.fn(),
}));

vi.mock("@/lib/server/safe-error", () => ({
  toSafeApiError: vi.fn((error: unknown, fallback?: string) =>
    error instanceof Error ? error.message : fallback ?? "Processing failed"
  ),
  captureApiError: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  logError: vi.fn().mockResolvedValue(undefined),
}));

import { isMaintenanceModeEnabled } from "@/lib/server/maintenance-mode";
import { guardToolRateLimit, guardApiKeyRateLimit } from "@/lib/server/rate-limiter";
import { guardToolMutationOrigin } from "@/lib/server/mutation-origin";
import { heavyJobCapacityResponse } from "@/lib/server/heavy-job-http";
import { authGuardResponse } from "@/lib/server/auth-guard-http";
import {
  beginToolRoute,
  guardMaintenanceMode,
  handleToolRouteFailure,
} from "@/lib/server/tool-request-guards";

function makeRequest(url = "https://onlymypdf.com/api/tools/merge-pdf") {
  return new NextRequest(url, { method: "POST" });
}

describe("tool-request-guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isMaintenanceModeEnabled).mockResolvedValue(false);
    vi.mocked(guardToolMutationOrigin).mockReturnValue(null);
    vi.mocked(guardApiKeyRateLimit).mockResolvedValue(null);
    vi.mocked(guardToolRateLimit).mockResolvedValue(null);
    vi.mocked(authGuardResponse).mockReturnValue(null);
    vi.mocked(heavyJobCapacityResponse).mockReturnValue(null);
  });

  it("returns 503 when maintenance mode is enabled", async () => {
    vi.mocked(isMaintenanceModeEnabled).mockResolvedValue(true);
    const response = await guardMaintenanceMode(makeRequest());
    expect(response?.status).toBe(503);
    const body = await response!.json();
    expect(body.error).toBe("Maintenance");
    expect(body.correlationId).toBeTruthy();
  });

  it("blocks invalid mutation origin", async () => {
    vi.mocked(guardToolMutationOrigin).mockReturnValue(
      NextResponse.json({ error: "blocked" }, { status: 403 })
    );
    const blocked = await beginToolRoute(makeRequest(), "merge-pdf");
    expect(blocked?.status).toBe(403);
  });

  it("returns maintenance before rate limits", async () => {
    vi.mocked(isMaintenanceModeEnabled).mockResolvedValue(true);
    const blocked = await beginToolRoute(makeRequest(), "merge-pdf");
    expect(blocked?.status).toBe(503);
    expect(guardToolRateLimit).not.toHaveBeenCalled();
  });

  it("maps usage limit errors to 429", async () => {
    const response = await handleToolRouteFailure(new Error("Daily usage limit reached"), {
      request: makeRequest(),
      toolSlug: "merge-pdf",
    });
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toMatch(/usage limit/i);
  });

  it("maps auth guard errors", async () => {
    vi.mocked(authGuardResponse).mockReturnValue(
      NextResponse.json({ error: "MFA required" }, { status: 403 })
    );
    const response = await handleToolRouteFailure(new Error("auth"), {
      request: makeRequest(),
      toolSlug: "merge-pdf",
    });
    expect(response.status).toBe(403);
  });

  it("returns safe 500 for unexpected errors", async () => {
    const response = await handleToolRouteFailure(new Error("boom"), {
      request: makeRequest(),
      toolSlug: "merge-pdf",
      fallbackMessage: "Tool failed",
    });
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("boom");
    expect(body.correlationId).toBeTruthy();
  });

  it("returns null when all guards pass", async () => {
    await expect(beginToolRoute(makeRequest(), "merge-pdf")).resolves.toBeNull();
  });

  it("returns tool rate limit response", async () => {
    vi.mocked(guardToolRateLimit).mockResolvedValue(
      NextResponse.json({ error: "Too many requests" }, { status: 429 })
    );
    const blocked = await beginToolRoute(makeRequest(), "merge-pdf");
    expect(blocked?.status).toBe(429);
  });

  it("returns api-key rate limit before tool rate limit", async () => {
    vi.mocked(guardApiKeyRateLimit).mockResolvedValue(
      NextResponse.json({ error: "API key limited" }, { status: 429 })
    );
    const blocked = await beginToolRoute(makeRequest(), "merge-pdf");
    expect(blocked?.status).toBe(429);
    expect(guardToolRateLimit).not.toHaveBeenCalled();
  });

  it("maps heavy job capacity errors", async () => {
    vi.mocked(heavyJobCapacityResponse).mockReturnValue(
      NextResponse.json({ error: "Busy" }, { status: 503 })
    );
    const response = await handleToolRouteFailure(new Error("semaphore"), {
      request: makeRequest(),
      toolSlug: "merge-pdf",
    });
    expect(response.status).toBe(503);
  });
});
