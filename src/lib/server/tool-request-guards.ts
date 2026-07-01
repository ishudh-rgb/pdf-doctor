import { NextRequest, NextResponse } from "next/server";
import {
  isMaintenanceModeEnabled,
  MAINTENANCE_MESSAGE,
} from "@/lib/server/maintenance-mode";
import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { heavyJobCapacityResponse } from "@/lib/server/heavy-job-http";
import { userBlockedResponse } from "@/lib/server/user-blocked-http";
import { toSafeApiError, captureApiError } from "@/lib/server/safe-error";
import { logError } from "@/lib/db/queries";

export async function guardMaintenanceMode(): Promise<NextResponse | null> {
  if (await isMaintenanceModeEnabled()) {
    return NextResponse.json({ error: MAINTENANCE_MESSAGE }, { status: 503 });
  }
  return null;
}

/** Maintenance + per-tool rate limit — call at the start of custom tool routes. */
export async function beginToolRoute(
  request: NextRequest,
  toolSlug: string
): Promise<NextResponse | null> {
  const maintenance = await guardMaintenanceMode();
  if (maintenance) return maintenance;
  const rate = await guardToolRateLimit(request, toolSlug);
  return rate as NextResponse | null;
}

export type ToolRouteErrorContext = {
  toolSlug: string;
  userId?: string | null;
  errorType?: string;
  fallbackMessage?: string;
};

/** Standard catch handler for custom tool routes (403 blocked, 503 busy, 429 limits, safe 500). */
export async function handleToolRouteFailure(
  error: unknown,
  ctx: ToolRouteErrorContext
): Promise<NextResponse> {
  const blocked = userBlockedResponse(error);
  if (blocked) return blocked;

  const capacity = heavyJobCapacityResponse(error);
  if (capacity) return capacity;

  const rawMessage = error instanceof Error ? error.message : "";
  if (rawMessage.includes("usage limit") || rawMessage.includes("limit reached")) {
    return NextResponse.json({ error: rawMessage }, { status: 429 });
  }

  const message = toSafeApiError(error, ctx.fallbackMessage ?? "Processing failed");

  await logError({
    user_id: ctx.userId ?? null,
    tool_name: ctx.toolSlug,
    error_type: ctx.errorType ?? "TOOL_ERROR",
    error_message: error instanceof Error ? error.message : message,
    stack_trace: error instanceof Error ? error.stack : undefined,
  }).catch(() => {});

  captureApiError(error, { route: `tools/${ctx.toolSlug}`, user_id: ctx.userId });

  return NextResponse.json({ error: message }, { status: 500 });
}
