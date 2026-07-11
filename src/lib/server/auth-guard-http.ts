import { NextResponse } from "next/server";
import {
  MfaAssuranceUnavailableError,
  MfaVerificationRequiredError,
} from "@/lib/auth/mfa-assurance";
import { userBlockedResponse } from "@/lib/server/user-blocked-http";

export function isMfaVerificationRequiredError(
  error: unknown
): error is MfaVerificationRequiredError {
  return error instanceof MfaVerificationRequiredError;
}

export function isMfaAssuranceUnavailableError(
  error: unknown
): error is MfaAssuranceUnavailableError {
  return error instanceof MfaAssuranceUnavailableError;
}

export function mfaRequiredResponse(error: unknown): NextResponse | null {
  if (!isMfaVerificationRequiredError(error)) return null;
  return NextResponse.json(
    {
      error: error.message,
      code: "MFA_REQUIRED",
    },
    { status: 403 }
  );
}

export function mfaAssuranceUnavailableResponse(error: unknown): NextResponse | null {
  if (!isMfaAssuranceUnavailableError(error)) return null;
  return NextResponse.json(
    {
      error: error.message,
      code: "MFA_ASSURANCE_UNAVAILABLE",
    },
    { status: 503 }
  );
}

/** Maps blocked-user and MFA auth errors to HTTP responses. */
export function authGuardResponse(error: unknown): NextResponse | null {
  return (
    userBlockedResponse(error) ??
    mfaRequiredResponse(error) ??
    mfaAssuranceUnavailableResponse(error)
  );
}
