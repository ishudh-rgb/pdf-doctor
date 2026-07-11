import { APP_NAME, SUPPORT_EMAIL } from "@/config/constants";
import { sendContactEmail } from "@/lib/email/contact-mailer";
import {
  countOrganizationMembers,
  getOrganizationMemberRole,
} from "@/lib/enterprise/organizations.service";
import { createServiceClient } from "@/lib/supabase/server";
import type { OrgBillingDuration } from "@/lib/enterprise/org-billing.service";

export class EnterpriseSalesRequiredError extends Error {
  readonly code = "ENTERPRISE_SALES_REQUIRED" as const;

  constructor(
    message = "Self-serve team billing requires enterprise sales activation.",
    readonly salesEmail: string = SUPPORT_EMAIL
  ) {
    super(message);
    this.name = "EnterpriseSalesRequiredError";
  }
}

export async function sendTeamPlanSalesRequest(input: {
  organizationId: string;
  requesterUserId: string;
  requesterEmail: string;
  duration: OrgBillingDuration;
  notes?: string;
}): Promise<{ delivered: boolean; mode: "email" | "dev" }> {
  const role = await getOrganizationMemberRole(input.organizationId, input.requesterUserId);
  if (role !== "owner") {
    throw new Error("Only the organization owner can request team billing activation.");
  }

  const supabase = await createServiceClient();
  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, name, seat_limit, plan_status")
    .eq("id", input.organizationId)
    .single();

  if (error || !org) throw new Error("Organization not found.");

  const seatCount = await countOrganizationMembers(input.organizationId);
  const safeNotes = input.notes?.trim().slice(0, 1000) ?? "";

  const result = await sendContactEmail({
    name: `${APP_NAME} organization owner`,
    email: input.requesterEmail,
    subject: `Team plan activation · ${org.name}`,
    message: [
      `Organization: ${org.name} (${input.organizationId})`,
      `Requested billing: ${input.duration}`,
      `Seats in use: ${seatCount} / ${org.seat_limit}`,
      `Plan status: ${org.plan_status ?? "inactive"}`,
      `Contact email: ${input.requesterEmail}`,
      safeNotes ? `\nNotes:\n${safeNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return { delivered: result.delivered, mode: result.mode };
}
