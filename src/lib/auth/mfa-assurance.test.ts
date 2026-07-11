import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  MfaAssuranceUnavailableError,
  MfaVerificationRequiredError,
  assertMfaAal2Satisfied,
  createMfaLoginChallenge,
  resolveMfaAssurance,
} from "@/lib/auth/mfa-assurance";

function mockSupabase(mfa: {
  assurance?: { currentLevel: string | null; nextLevel: string | null };
  assuranceError?: Error;
  factors?: { totp?: Array<{ id: string; status: string }> };
  factorsError?: Error;
  challenge?: { id: string } | null;
  challengeError?: Error;
}) {
  return {
    auth: {
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(async () => {
          if (mfa.assuranceError) {
            return { data: null, error: mfa.assuranceError };
          }
          return {
            data: mfa.assurance ?? { currentLevel: "aal1", nextLevel: "aal1" },
            error: null,
          };
        }),
        listFactors: vi.fn(async () => {
          if (mfa.factorsError) {
            return { data: null, error: mfa.factorsError };
          }
          return {
            data: { totp: mfa.factors?.totp ?? [] },
            error: null,
          };
        }),
        challenge: vi.fn(async () => {
          if (mfa.challengeError) {
            return { data: null, error: mfa.challengeError };
          }
          return { data: mfa.challenge ?? null, error: null };
        }),
      },
    },
  } as unknown as Parameters<typeof resolveMfaAssurance>[0];
}

describe("mfa-assurance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires verification when next level is aal2 but current is not", async () => {
    const supabase = mockSupabase({
      assurance: { currentLevel: "aal1", nextLevel: "aal2" },
    });

    const state = await resolveMfaAssurance(supabase);
    expect(state.requiresMfaVerification).toBe(true);

    await expect(assertMfaAal2Satisfied(supabase)).rejects.toBeInstanceOf(
      MfaVerificationRequiredError
    );
  });

  it("passes when current level is already aal2", async () => {
    const supabase = mockSupabase({
      assurance: { currentLevel: "aal2", nextLevel: "aal2" },
    });

    const state = await resolveMfaAssurance(supabase);
    expect(state.requiresMfaVerification).toBe(false);
    await expect(assertMfaAal2Satisfied(supabase)).resolves.toBeUndefined();
  });

  it("passes when user has no enrolled MFA (aal1 only)", async () => {
    const supabase = mockSupabase({
      assurance: { currentLevel: "aal1", nextLevel: "aal1" },
    });

    expect(await resolveMfaAssurance(supabase)).toMatchObject({
      requiresMfaVerification: false,
    });
  });

  it("fails closed when assurance lookup errors", async () => {
    const supabase = mockSupabase({ assuranceError: new Error("network") });
    await expect(resolveMfaAssurance(supabase)).rejects.toBeInstanceOf(
      MfaAssuranceUnavailableError
    );
    await expect(assertMfaAal2Satisfied(supabase)).rejects.toBeInstanceOf(
      MfaAssuranceUnavailableError
    );
  });

  it("creates login challenge for verified TOTP factor", async () => {
    const supabase = mockSupabase({
      factors: { totp: [{ id: "factor-1", status: "verified" }] },
      challenge: { id: "challenge-1" },
    });

    await expect(createMfaLoginChallenge(supabase)).resolves.toEqual({
      factorId: "factor-1",
      challengeId: "challenge-1",
    });
  });

  it("returns null when no verified TOTP factor exists", async () => {
    const supabase = mockSupabase({
      factors: { totp: [{ id: "factor-1", status: "unverified" }] },
    });
    await expect(createMfaLoginChallenge(supabase)).resolves.toBeNull();
  });
});
