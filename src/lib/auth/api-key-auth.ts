import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/db/queries";
import { isBlockedProfile } from "@/lib/auth/plan-access";
import { resolveProAccessForUser } from "@/lib/enterprise/org-access.service";
import { getOrganizationMemberRole } from "@/lib/enterprise/organizations.service";
import { isOrgPlanActiveForApiKeys } from "@/lib/enterprise/org-plan-policy";

export type ValidatedApiKey = {
  id: string;
  userId: string;
  organizationId: string | null;
  scopes: string[];
  name: string;
};

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function extractApiKeyFromRequest(request: NextRequest): string | null {
  const headerKey = request.headers.get("x-api-key")?.trim();
  if (headerKey?.startsWith("omp_")) return headerKey;

  const auth = request.headers.get("authorization")?.trim();
  if (!auth) return null;

  const bearerMatch = /^Bearer\s+(.+)$/i.exec(auth);
  const token = bearerMatch?.[1]?.trim();
  if (token?.startsWith("omp_")) return token;

  return null;
}

export function hasApiKeyHeader(request: NextRequest): boolean {
  return extractApiKeyFromRequest(request) != null;
}

export async function validateApiKeyFromRequest(
  request: NextRequest
): Promise<ValidatedApiKey | null> {
  const raw = extractApiKeyFromRequest(request);
  if (!raw) return null;

  const keyHash = hashApiKey(raw);
  const supabase = await createServiceClient();

  const { data: row, error } = await supabase
    .from("api_keys")
    .select("id, user_id, organization_id, scopes, name, expires_at, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (error || !row || row.revoked_at) return null;

  if (row.expires_at && new Date(row.expires_at) <= new Date()) {
    return null;
  }

  const profile = await getUserProfile(row.user_id);
  if (isBlockedProfile(profile)) return null;

  if (row.organization_id) {
    const role = await getOrganizationMemberRole(row.organization_id, row.user_id);
    if (!role || (role !== "owner" && role !== "admin")) return null;

    const { data: org } = await supabase
      .from("organizations")
      .select("plan_status, plan_expires_at")
      .eq("id", row.organization_id)
      .maybeSingle();

    if (!org || !isOrgPlanActiveForApiKeys(org)) return null;
  }

  const access = await resolveProAccessForUser(row.user_id);
  if (!access.isPro) return null;

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id)
    .then(() => {});

  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id ?? null,
    scopes: Array.isArray(row.scopes) ? row.scopes : ["tools:read", "tools:write"],
    name: row.name,
  };
}

export function apiKeyHasWriteScope(scopes: string[]): boolean {
  return scopes.includes("tools:write") || scopes.includes("*");
}
