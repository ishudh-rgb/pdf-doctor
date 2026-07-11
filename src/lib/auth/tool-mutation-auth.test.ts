import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/api-key-auth", () => ({
  hasApiKeyHeader: vi.fn(),
}));

vi.mock("@/lib/auth/resolve-tool-request-auth", () => ({
  resolveToolRequestAuth: vi.fn(),
}));

vi.mock("@/lib/auth/get-tool-request-user", () => ({
  getToolRequestUserId: vi.fn(),
}));

import { hasApiKeyHeader } from "@/lib/auth/api-key-auth";
import { resolveToolRequestAuth } from "@/lib/auth/resolve-tool-request-auth";
import { getToolRequestUserId } from "@/lib/auth/get-tool-request-user";
import { resolveMutationToolUser } from "@/lib/auth/tool-mutation-auth";

describe("resolveMutationToolUser", () => {
  beforeEach(() => {
    vi.mocked(hasApiKeyHeader).mockReset();
    vi.mocked(resolveToolRequestAuth).mockReset();
    vi.mocked(getToolRequestUserId).mockReset();
  });

  it("denies read-only API keys on mutations", async () => {
    vi.mocked(hasApiKeyHeader).mockReturnValue(true);
    vi.mocked(resolveToolRequestAuth).mockResolvedValue({
      userId: null,
      authMethod: "none",
    });

    const request = new NextRequest("http://localhost/api/tools/merge-pdf", {
      method: "POST",
      headers: { "x-api-key": "omp_test" },
    });

    const result = await resolveMutationToolUser(request);
    expect(result.userId).toBeNull();
    expect(result.denied?.status).toBe(401);
    expect(resolveToolRequestAuth).toHaveBeenCalledWith(request, { requireWrite: true });
  });

  it("allows write-scoped API keys", async () => {
    vi.mocked(hasApiKeyHeader).mockReturnValue(true);
    vi.mocked(resolveToolRequestAuth).mockResolvedValue({
      userId: "user-1",
      authMethod: "api_key",
      apiKey: {
        id: "key-1",
        userId: "user-1",
        organizationId: null,
        scopes: ["tools:write"],
        name: "test",
      },
    });

    const request = new NextRequest("http://localhost/api/tools/merge-pdf", {
      method: "POST",
      headers: { "x-api-key": "omp_test" },
    });

    const result = await resolveMutationToolUser(request);
    expect(result.denied).toBeNull();
    expect(result.userId).toBe("user-1");
  });

  it("falls back to session user when no API key", async () => {
    vi.mocked(hasApiKeyHeader).mockReturnValue(false);
    vi.mocked(getToolRequestUserId).mockResolvedValue("session-user");

    const request = new NextRequest("http://localhost/api/tools/merge-pdf", {
      method: "POST",
    });

    const result = await resolveMutationToolUser(request);
    expect(result.denied).toBeNull();
    expect(result.userId).toBe("session-user");
  });
});
