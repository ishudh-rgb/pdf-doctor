import type { NextRequest } from "next/server";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export function getCorrelationId(request?: NextRequest | null): string {
  const existing = request?.headers.get(CORRELATION_ID_HEADER)?.trim();
  if (existing) return existing;
  return crypto.randomUUID();
}
