import { isActivePro, isBlockedProfile } from "@/lib/auth/plan-access";
import { resolveProAccessForUser } from "@/lib/enterprise/org-access.service";

type SessionProfileRow = {
  id: string;
  email: string;
  full_name?: string | null;
  role?: string | null;
  plan?: string | null;
  plan_expires_at?: string | null;
  total_files_processed?: number | null;
  ai_credits_used?: number | null;
  is_blocked?: boolean | null;
};

export type SessionPayload = {
  user: { id: string; email: string; created_at: string } | null;
  profile: SessionProfileRow | null;
  accountStatus: "active" | "blocked";
  effectivePlan: "free" | "pro";
  proSource?: "individual" | "organization" | "none";
  organizationName?: string;
  requiresMfa?: boolean;
  mfaChallenge?: { factorId: string; challengeId: string };
};

export function buildSessionPayload(
  user: { id: string; email: string; created_at: string } | null,
  profile: SessionProfileRow | null,
  options?: {
    effectivePlan?: "free" | "pro";
    proSource?: SessionPayload["proSource"];
    organizationName?: string;
  }
): SessionPayload {
  if (!user) {
    return { user: null, profile: null, accountStatus: "active", effectivePlan: "free" };
  }

  const blocked = profile ? isBlockedProfile(profile) : false;
  const individualPro = profile ? isActivePro(profile) : false;
  const effectivePlan =
    options?.effectivePlan ?? (individualPro ? "pro" : "free");

  return {
    user,
    profile: profile
      ? {
          ...profile,
          plan: effectivePlan,
        }
      : null,
    accountStatus: blocked ? "blocked" : "active",
    effectivePlan,
    proSource: options?.proSource ?? (individualPro ? "individual" : "none"),
    organizationName: options?.organizationName,
  };
}

export async function buildSessionPayloadForUser(
  user: { id: string; email: string; created_at: string },
  profile: SessionProfileRow | null
): Promise<SessionPayload> {
  let proSource: SessionPayload["proSource"] = profile && isActivePro(profile) ? "individual" : "none";
  let effectivePlan: "free" | "pro" = proSource === "individual" ? "pro" : "free";
  let organizationName: string | undefined;

  try {
    const access = await resolveProAccessForUser(user.id);
    if (access.isPro) {
      effectivePlan = "pro";
      proSource = access.source;
      organizationName = access.organizationName;
    }
  } catch {
    // fall back to individual plan flags
  }

  return buildSessionPayload(user, profile, {
    effectivePlan,
    proSource,
    organizationName,
  });
}
