import { NextResponse } from "next/server";
import { UserBlockedError } from "@/lib/auth/plan-access";

export function isUserBlockedError(error: unknown): error is UserBlockedError {
  return error instanceof UserBlockedError;
}

export function userBlockedResponse(error: unknown): NextResponse | null {
  if (!isUserBlockedError(error)) return null;
  return NextResponse.json({ error: error.message }, { status: 403 });
}
