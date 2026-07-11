import { createHash, randomBytes } from "node:crypto";
import { getOrganizationMemberRole } from "@/lib/enterprise/organizations.service";
import { isOrgPlanActiveForApiKeys } from "@/lib/enterprise/org-plan-policy";
import { createServiceClient } from "@/lib/supabase/server";

export class ApiKeyOrganizationAccessError extends Error {
  readonly statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = "ApiKeyOrganizationAccessError";
  }
}

export type ApiKeyRecord = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function assertApiKeyOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<void> {
  const role = await getOrganizationMemberRole(organizationId, userId);
  if (!role || (role !== "owner" && role !== "admin")) {
    throw new ApiKeyOrganizationAccessError(
      "You must be an organization owner or admin to create org-scoped API keys."
    );
  }

  const supabase = await createServiceClient();
  const { data: org, error } = await supabase
    .from("organizations")
    .select("plan_status, plan_expires_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !org) {
    throw new ApiKeyOrganizationAccessError("Organization not found.");
  }

  if (!isOrgPlanActiveForApiKeys(org)) {
    throw new ApiKeyOrganizationAccessError(
      "Organization team plan must be active before creating org-scoped API keys."
    );
  }
}

export async function listUserApiKeys(userId: string): Promise<ApiKeyRecord[]> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, created_at, last_used_at, expires_at, revoked_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ApiKeyRecord[];
}

export async function createUserApiKey(
  userId: string,
  name: string,
  organizationId?: string | null
): Promise<{ record: ApiKeyRecord; secret: string }> {
  if (organizationId) {
    await assertApiKeyOrganizationAccess(userId, organizationId);
  }

  const raw = `omp_${randomBytes(24).toString("hex")}`;
  const key_prefix = raw.slice(0, 12);
  const key_hash = hashKey(raw);

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: userId,
      organization_id: organizationId ?? null,
      name: name.trim().slice(0, 80),
      key_prefix,
      key_hash,
    })
    .select("id, name, key_prefix, scopes, created_at, last_used_at, expires_at, revoked_at")
    .single();

  if (error) throw error;
  return { record: data as ApiKeyRecord, secret: raw };
}

export async function revokeUserApiKey(userId: string, keyId: string): Promise<void> {
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", userId);

  if (error) throw error;
}
