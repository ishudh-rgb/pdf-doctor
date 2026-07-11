import { isMockBillingMode } from "@/lib/billing/billing-config";
import { createMockSubscriptionId } from "@/lib/billing/mock-billing.service";
import { createPayment } from "@/lib/db/queries";
import { issueGstInvoiceForPayment } from "@/lib/billing/invoice.service";
import { TEAM_PRICING } from "@/config/constants";
import { EnterpriseSalesRequiredError } from "@/lib/enterprise/enterprise-sales";
import {
  activateOrganizationPlan,
  countOrganizationMembers,
  getOrganizationMemberRole,
} from "@/lib/enterprise/organizations.service";
import { createServiceClient } from "@/lib/supabase/server";

export type OrgBillingDuration = "monthly" | "yearly";

function addPeriod(from: Date, duration: OrgBillingDuration): Date {
  const end = new Date(from);
  if (duration === "yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

function computeTeamAmountInr(seatCount: number, duration: OrgBillingDuration): number {
  const perSeat =
    duration === "yearly"
      ? TEAM_PRICING.yearlyInrPerSeat
      : TEAM_PRICING.monthlyInrPerSeat;
  return perSeat * Math.max(1, seatCount);
}

export async function activateOrganizationBilling(
  organizationId: string,
  ownerUserId: string,
  duration: OrgBillingDuration
): Promise<{ periodEnd: string; mock: boolean }> {
  const role = await getOrganizationMemberRole(organizationId, ownerUserId);
  if (role !== "owner") {
    throw new Error("Only the organization owner can activate team billing.");
  }

  const supabase = await createServiceClient();
  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, name, seat_limit, plan_status")
    .eq("id", organizationId)
    .single();

  if (error || !org) throw new Error("Organization not found.");

  if (!isMockBillingMode()) {
    throw new EnterpriseSalesRequiredError(
      "Self-serve team billing is not live yet. Contact enterprise sales to activate your organization plan."
    );
  }

  const seatCount = await countOrganizationMembers(organizationId);
  const amountInr = computeTeamAmountInr(seatCount, duration);
  const periodEnd = addPeriod(new Date(), duration);
  const mockSubId = createMockSubscriptionId();

  await activateOrganizationPlan(organizationId, {
    razorpaySubscriptionId: mockSubId,
    periodEnd,
    dailyToolLimit: TEAM_PRICING.defaultDailyToolLimit,
  });

  const payment = await createPayment({
    user_id: ownerUserId,
    razorpay_subscription_id: mockSubId,
    amount: amountInr,
    currency: "INR",
    status: "completed",
    plan_name: "team",
    plan_duration: duration,
    billing_mode: "subscription",
  });

  await issueGstInvoiceForPayment({
    userId: ownerUserId,
    paymentId: payment.id,
    amountPaise: Math.round(amountInr * 100),
    razorpayPaymentId: `pay_mock_org_${organizationId.slice(0, 8)}`,
    planLabel: `Team ${duration} · ${org.name}`,
    organizationId,
  }).catch(() => {});

  return { periodEnd: periodEnd.toISOString(), mock: true };
}

export async function cancelOrganizationAutoRenew(
  organizationId: string,
  actorUserId: string
): Promise<void> {
  const role = await getOrganizationMemberRole(organizationId, actorUserId);
  if (role !== "owner") {
    throw new Error("Only the organization owner can cancel team billing.");
  }

  const supabase = await createServiceClient();
  await supabase
    .from("organizations")
    .update({
      razorpay_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationId);
}

export async function renewOrganizationPlanFromWebhook(input: {
  razorpaySubscriptionId: string;
  amountPaise?: number | null;
  paymentId?: string | null;
}): Promise<boolean> {
  const supabase = await createServiceClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, owner_id, name, seat_limit, plan_expires_at")
    .eq("razorpay_subscription_id", input.razorpaySubscriptionId)
    .maybeSingle();

  if (!org) return false;

  const extendFrom =
    org.plan_expires_at && new Date(org.plan_expires_at) > new Date()
      ? new Date(org.plan_expires_at)
      : new Date();
  const periodEnd = addPeriod(extendFrom, "monthly");

  await activateOrganizationPlan(org.id, {
    razorpaySubscriptionId: input.razorpaySubscriptionId,
    periodEnd,
    dailyToolLimit: TEAM_PRICING.defaultDailyToolLimit,
  });

  if (input.paymentId && input.amountPaise) {
    const payment = await createPayment({
      user_id: org.owner_id,
      razorpay_payment_id: input.paymentId,
      razorpay_subscription_id: input.razorpaySubscriptionId,
      amount: input.amountPaise / 100,
      currency: "INR",
      status: "completed",
      plan_name: "team",
      plan_duration: "monthly",
      billing_mode: "subscription",
    });

    await issueGstInvoiceForPayment({
      userId: org.owner_id,
      paymentId: payment.id,
      amountPaise: input.amountPaise,
      razorpayPaymentId: input.paymentId,
      planLabel: `Team renewal · ${org.name}`,
      organizationId: org.id,
    }).catch(() => {});
  }

  return true;
}

export async function clearOrganizationAutoRenewByRazorpaySub(
  razorpaySubscriptionId: string
): Promise<boolean> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({
      razorpay_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("razorpay_subscription_id", razorpaySubscriptionId)
    .select("id");

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
