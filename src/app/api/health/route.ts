import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isProductionReady } from "@/lib/config/env-security";
import { getCleanupStats } from "@/lib/services/cleanup.service";
import { isHealthDetailAuthorized } from "@/lib/ops/health-auth";

export const dynamic = "force-dynamic";

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

export async function GET(request: NextRequest) {
  const detailed = isHealthDetailAuthorized(request);

  if (!detailed) {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }

  const checks: Record<string, { ok: boolean; detail?: string }> = {
    app: { ok: true },
    secrets: { ok: isProductionReady() },
    upstash: {
      ok: isUpstashConfigured(),
      detail: "Required for distributed rate limits in production",
    },
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServiceClient();
      const { error } = await supabase.from("user_profiles").select("id").limit(1);
      checks.database = { ok: !error, detail: error?.message };
    } catch (err) {
      checks.database = {
        ok: false,
        detail: err instanceof Error ? err.message : "Database unreachable",
      };
    }

    try {
      const stats = await getCleanupStats();
      checks.storage_cleanup = {
        ok: stats.pendingCleanup < 10_000,
        detail: `pending=${stats.pendingCleanup} deleted_total=${stats.totalDeleted}`,
      };
    } catch (err) {
      checks.storage_cleanup = {
        ok: false,
        detail: err instanceof Error ? err.message : "Cleanup stats failed",
      };
    }
  } else {
    checks.database = { ok: false, detail: "Supabase not configured" };
  }

  const isProd = process.env.NODE_ENV === "production";
  const allCriticalOk =
    checks.app.ok &&
    checks.secrets.ok &&
    (checks.database?.ok ?? false) &&
    (!isProd || checks.upstash.ok);

  const status = allCriticalOk ? 200 : 503;

  return NextResponse.json(
    {
      status: allCriticalOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}
