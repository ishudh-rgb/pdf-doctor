import { createServiceClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/db/queries";
import { isActivePro } from "@/lib/auth/plan-access";
import { isOrgPlanActiveForMemberAccess } from "@/lib/enterprise/org-plan-policy";

export type ProAccessSource = "individual" | "organization" | "none";

export type ProAccessResult = {
  isPro: boolean;
  source: ProAccessSource;
  organizationId?: string;
  organizationName?: string;
};

type OrgRow = {
  id: string;
  name: string;
  plan_status: string;
  plan_expires_at: string | null;
  daily_tool_limit: number;
};

function isOrgPlanActive(org: OrgRow): boolean {
  return isOrgPlanActiveForMemberAccess(org);
}

export async function getActiveOrganizationsForUser(userId: string): Promise<OrgRow[]> {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("organization_members")
      .select(
        "organizations ( id, name, plan_status, plan_expires_at, daily_tool_limit )"
      )
      .eq("user_id", userId);

    if (error) {
      // Enterprise tables/migrations may not be applied yet — do not break tool routes.
      console.warn("[org-access] organization lookup skipped:", error.message);
      return [];
    }

    const orgs: OrgRow[] = [];
    for (const row of data ?? []) {
      const org = (row as { organizations: OrgRow | OrgRow[] | null }).organizations;
      const resolved = Array.isArray(org) ? org[0] : org;
      if (resolved && isOrgPlanActive(resolved)) {
        orgs.push(resolved);
      }
    }
    return orgs;
  } catch (err) {
    console.warn("[org-access] organization lookup failed:", err);
    return [];
  }
}

export async function resolveProAccessForUser(userId: string): Promise<ProAccessResult> {
  const profile = await getUserProfile(userId);
  if (isActivePro(profile)) {
    return { isPro: true, source: "individual" };
  }

  const orgs = await getActiveOrganizationsForUser(userId);
  if (orgs.length > 0) {
    const primary = orgs[0];
    return {
      isPro: true,
      source: "organization",
      organizationId: primary.id,
      organizationName: primary.name,
    };
  }

  return { isPro: false, source: "none" };
}

export async function getPrimaryOrganizationForUser(
  userId: string
): Promise<OrgRow | null> {
  const orgs = await getActiveOrganizationsForUser(userId);
  return orgs[0] ?? null;
}
