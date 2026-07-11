import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/auth/verify-admin", () => ({
  verifyAdmin: vi.fn(),
}));

vi.mock("@/lib/server/mutation-origin", () => ({
  guardMutationOrigin: vi.fn(),
}));

vi.mock("@/lib/admin/audit-log", () => ({
  logAdminAction: vi.fn(),
}));

vi.mock("@/lib/server/client-ip", () => ({
  getGuestUsageKey: vi.fn(() => "guest-key"),
}));

vi.mock("@/lib/server/safe-error", () => ({
  toSafeApiError: vi.fn((_err: unknown, fallback: string) => fallback),
}));

vi.mock("@/lib/payment/payment-amount", () => ({
  storedAmountInInr: vi.fn((n: number) => n),
}));

import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { GET as adminOrgsGET } from "@/app/api/admin/organizations/route";
import { GET as adminUsersGET } from "@/app/api/admin/users/route";
import { GET as adminPaymentsGET } from "@/app/api/admin/payments/route";
import { GET as adminSettingsGET } from "@/app/api/admin/settings/route";

function adminRequest(url: string): NextRequest {
  return { url, headers: new Headers() } as NextRequest;
}

describe("admin API route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAdmin).mockResolvedValue({ id: "admin-1", email: "admin@example.com" } as never);
    vi.mocked(guardMutationOrigin).mockReturnValue(null);
  });

  it("lists organizations for admins", async () => {
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "org-1",
                    name: "Acme",
                    seat_limit: 5,
                    plan_status: "active",
                    plan_expires_at: null,
                    created_at: "2026-01-01T00:00:00.000Z",
                  },
                ],
                count: 1,
                error: null,
              }),
            }),
          }),
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "org-1",
                  name: "Acme",
                  seat_limit: 5,
                  plan_status: "active",
                  plan_expires_at: null,
                  created_at: "2026-01-01T00:00:00.000Z",
                },
              ],
              count: 1,
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const response = await adminOrgsGET(adminRequest("http://localhost/api/admin/organizations"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.organizations).toHaveLength(1);
    expect(body.organizations[0].name).toBe("Acme");
  });

  it("lists users for admins", async () => {
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [{ id: "user-1", email: "user@example.com", plan: "free" }],
                  count: 1,
                  error: null,
                }),
              }),
            }),
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [{ id: "user-1", email: "user@example.com", plan: "free" }],
                count: 1,
                error: null,
              }),
            }),
          }),
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [{ id: "user-1", email: "user@example.com", plan: "free" }],
                count: 1,
                error: null,
              }),
            }),
          }),
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: [{ id: "user-1", email: "user@example.com", plan: "free" }],
              count: 1,
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const response = await adminUsersGET(adminRequest("http://localhost/api/admin/users?page=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toHaveLength(1);
  });

  it("rejects non-admin callers", async () => {
    vi.mocked(verifyAdmin).mockResolvedValue(null);

    const response = await adminOrgsGET(adminRequest("http://localhost/api/admin/organizations"));
    expect(response.status).toBe(403);
  });

  it("returns admin settings", async () => {
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ key: "ads_enabled", value: "false" }],
          error: null,
        }),
      }),
    } as never);

    const response = await adminSettingsGET(adminRequest("http://localhost/api/admin/settings"));
    expect(response.status).toBe(200);
  });

  it("returns payment summaries for admins", async () => {
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: "pay-1", amount: 299, status: "completed" }],
                error: null,
              }),
            }),
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ id: "pay-1", amount: 299, status: "completed" }],
                  error: null,
                }),
              }),
            }),
          }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{ id: "pay-1", amount: 299, status: "completed" }],
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const response = await adminPaymentsGET(adminRequest("http://localhost/api/admin/payments"));
    expect(response.status).toBe(200);
  });
});
