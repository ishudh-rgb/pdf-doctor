export type OrgPlanRow = {
  plan_status: string;
  plan_expires_at: string | null;
};

export function isOrgPlanExpired(org: OrgPlanRow): boolean {
  if (!org.plan_expires_at) return false;
  return new Date(org.plan_expires_at) <= new Date();
}

/** Member tool/dashboard access — past_due allowed until plan_expires_at. */
export function isOrgPlanActiveForMemberAccess(org: OrgPlanRow): boolean {
  if (isOrgPlanExpired(org)) return false;
  return org.plan_status === "active" || org.plan_status === "past_due";
}

/** Org-scoped API keys require fully active billing (no past_due). */
export function isOrgPlanActiveForApiKeys(org: OrgPlanRow): boolean {
  if (isOrgPlanExpired(org)) return false;
  return org.plan_status === "active";
}
