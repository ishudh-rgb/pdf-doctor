import { describe, expect, it } from "vitest";
import { MfaAssuranceUnavailableError, MfaVerificationRequiredError } from "@/lib/auth/mfa-assurance";
import { UserBlockedError } from "@/lib/auth/plan-access";
import {
  authGuardResponse,
  isMfaAssuranceUnavailableError,
  isMfaVerificationRequiredError,
  mfaAssuranceUnavailableResponse,
  mfaRequiredResponse,
} from "@/lib/server/auth-guard-http";

describe("auth-guard-http", () => {
  it("maps MFA pending to 403 with MFA_REQUIRED code", async () => {
    const error = new MfaVerificationRequiredError();
    expect(isMfaVerificationRequiredError(error)).toBe(true);

    const response = mfaRequiredResponse(error);
    expect(response?.status).toBe(403);
    const body = await response!.json();
    expect(body.code).toBe("MFA_REQUIRED");
    expect(body.error).toMatch(/multi-factor/i);
  });

  it("returns null for unrelated errors", () => {
    expect(mfaRequiredResponse(new Error("nope"))).toBeNull();
    expect(isMfaVerificationRequiredError(new Error("nope"))).toBe(false);
  });

  it("prefers blocked-user response over MFA", async () => {
    const blocked = new UserBlockedError();
    const response = authGuardResponse(blocked);
    expect(response?.status).toBe(403);
    const body = await response!.json();
    expect(body.code).toBeUndefined();
    expect(body.error).toMatch(/suspended/i);
  });

  it("maps MFA when user is not blocked", async () => {
    const response = authGuardResponse(new MfaVerificationRequiredError());
    expect(response?.status).toBe(403);
    const body = await response!.json();
    expect(body.code).toBe("MFA_REQUIRED");
  });

  it("maps MFA assurance outages to 503", async () => {
    const error = new MfaAssuranceUnavailableError();
    expect(isMfaAssuranceUnavailableError(error)).toBe(true);

    const response = mfaAssuranceUnavailableResponse(error);
    expect(response?.status).toBe(503);
    const body = await response!.json();
    expect(body.code).toBe("MFA_ASSURANCE_UNAVAILABLE");

    expect(mfaAssuranceUnavailableResponse(new Error("nope"))).toBeNull();
    expect(authGuardResponse(error)?.status).toBe(503);
  });
});
