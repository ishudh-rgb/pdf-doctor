import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnterpriseSalesRequiredError, sendTeamPlanSalesRequest } from "@/lib/enterprise/enterprise-sales";

vi.mock("@/lib/enterprise/organizations.service", () => ({
  getOrganizationMemberRole: vi.fn(),
  countOrganizationMembers: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/email/contact-mailer", () => ({
  sendContactEmail: vi.fn(),
}));

import { countOrganizationMembers, getOrganizationMemberRole } from "@/lib/enterprise/organizations.service";
import { createServiceClient } from "@/lib/supabase/server";
import { sendContactEmail } from "@/lib/email/contact-mailer";

describe("enterprise-sales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRole).mockResolvedValue("owner");
    vi.mocked(countOrganizationMembers).mockResolvedValue(3);
    vi.mocked(sendContactEmail).mockResolvedValue({ delivered: true, mode: "email" });
    vi.mocked(createServiceClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "org-1",
                name: "Acme",
                seat_limit: 5,
                plan_status: "inactive",
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never);
  });

  it("exposes sales-required error metadata", () => {
    const err = new EnterpriseSalesRequiredError();
    expect(err.code).toBe("ENTERPRISE_SALES_REQUIRED");
    expect(err.salesEmail).toBeTruthy();
  });

  it("sends team plan sales request for organization owners", async () => {
    const result = await sendTeamPlanSalesRequest({
      organizationId: "org-1",
      requesterUserId: "user-1",
      requesterEmail: "owner@example.com",
      duration: "monthly",
      notes: "Need 10 seats",
    });

    expect(result.delivered).toBe(true);
    expect(sendContactEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Acme"),
      })
    );
  });

  it("rejects sales requests from non-owners", async () => {
    vi.mocked(getOrganizationMemberRole).mockResolvedValue("member");

    await expect(
      sendTeamPlanSalesRequest({
        organizationId: "org-1",
        requesterUserId: "user-2",
        requesterEmail: "member@example.com",
        duration: "yearly",
      })
    ).rejects.toThrow("Only the organization owner");
  });
});
