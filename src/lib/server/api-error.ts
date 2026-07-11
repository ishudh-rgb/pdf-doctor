import { NextResponse, type NextRequest } from "next/server";
import { CORRELATION_ID_HEADER, getCorrelationId } from "@/lib/server/correlation-id";
import { captureApiError, toSafeApiError } from "@/lib/server/safe-error";
import { logSafeError } from "@/lib/server/safe-log";

/** Client-safe JSON error with correlation ID — never includes stack traces or paths. */
export function jsonApiError(
  request: NextRequest,
  error: unknown,
  status: number,
  fallback = "An unexpected error occurred. Please try again.",
  context?: Record<string, unknown>
): NextResponse {
  const correlationId = getCorrelationId(request);
  const message = toSafeApiError(error, fallback);
  logSafeError(`api:${correlationId}`, error);
  captureApiError(error, {
    ...context,
    correlationId,
    route: request.nextUrl.pathname,
  });
  return NextResponse.json(
    { error: message, correlationId },
    { status, headers: { [CORRELATION_ID_HEADER]: correlationId } }
  );
}

export function jsonApiMessage(
  request: NextRequest,
  message: string,
  status: number
): NextResponse {
  const correlationId = getCorrelationId(request);
  return NextResponse.json(
    { error: message, correlationId },
    { status, headers: { [CORRELATION_ID_HEADER]: correlationId } }
  );
}
