import type { SupabaseClient } from "@supabase/supabase-js";

export class MfaVerificationRequiredError extends Error {
  readonly code = "MFA_REQUIRED";

  constructor(message = "Multi-factor authentication verification required") {
    super(message);
    this.name = "MfaVerificationRequiredError";
  }
}

/** Raised when MFA assurance cannot be checked — fail closed (503), not fail open. */
export class MfaAssuranceUnavailableError extends Error {
  readonly code = "MFA_ASSURANCE_UNAVAILABLE";

  constructor(
    message = "Unable to verify multi-factor authentication status. Please try again shortly."
  ) {
    super(message);
    this.name = "MfaAssuranceUnavailableError";
  }
}

export type MfaAssuranceState = {
  requiresMfaVerification: boolean;
  currentLevel: string | null;
  nextLevel: string | null;
};

export async function resolveMfaAssurance(
  supabase: SupabaseClient
): Promise<MfaAssuranceState> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error || !data) {
    throw new MfaAssuranceUnavailableError();
  }

  const requiresMfaVerification =
    data.nextLevel === "aal2" && data.currentLevel !== "aal2";

  return {
    requiresMfaVerification,
    currentLevel: data.currentLevel ?? null,
    nextLevel: data.nextLevel ?? null,
  };
}

export async function assertMfaAal2Satisfied(supabase: SupabaseClient): Promise<void> {
  const assurance = await resolveMfaAssurance(supabase);
  if (assurance.requiresMfaVerification) {
    throw new MfaVerificationRequiredError();
  }
}

export async function createMfaLoginChallenge(
  supabase: SupabaseClient
): Promise<{ factorId: string; challengeId: string } | null> {
  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) return null;

  const totpFactor = factorsData?.totp?.find((f) => f.status === "verified");
  if (!totpFactor) return null;

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: totpFactor.id,
  });

  if (challengeError || !challenge) return null;

  return { factorId: totpFactor.id, challengeId: challenge.id };
}
