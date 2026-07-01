import { NextResponse } from "next/server";
import { HeavyJobCapacityError } from "@/lib/server/conversion-semaphore";

export function isHeavyJobCapacityError(error: unknown): error is HeavyJobCapacityError {
  return error instanceof HeavyJobCapacityError;
}

/** Return 503 with a user-safe busy message when the heavy-job semaphore is full. */
export function heavyJobCapacityResponse(error: unknown): NextResponse | null {
  if (!isHeavyJobCapacityError(error)) return null;
  return NextResponse.json({ error: error.message }, { status: 503 });
}
