import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();
    const { data: profile } = await serviceClient
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthISO = monthStart.toISOString();

    const [
      totalUsersRes,
      proUsersRes,
      filesTodayRes,
      totalFilesRes,
      revenueRes,
      toolUsageRes,
      aiUsageRes,
      errorCountRes,
    ] = await Promise.all([
      serviceClient
        .from("user_profiles")
        .select("id", { count: "exact", head: true }),
      serviceClient
        .from("user_profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan", "pro"),
      serviceClient
        .from("usage_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayISO),
      serviceClient
        .from("usage_logs")
        .select("id", { count: "exact", head: true }),
      serviceClient
        .from("payments")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", monthISO),
      serviceClient
        .from("usage_logs")
        .select("tool_name"),
      serviceClient
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true }),
      serviceClient
        .from("error_logs")
        .select("id", { count: "exact", head: true }),
    ]);

    const revenueThisMonth = revenueRes.data?.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    ) ?? 0;

    const toolBreakdown: Record<string, number> = {};
    for (const row of toolUsageRes.data ?? []) {
      toolBreakdown[row.tool_name] = (toolBreakdown[row.tool_name] || 0) + 1;
    }

    return NextResponse.json({
      totalUsers: totalUsersRes.count ?? 0,
      proUsers: proUsersRes.count ?? 0,
      filesProcessedToday: filesTodayRes.count ?? 0,
      totalFilesAllTime: totalFilesRes.count ?? 0,
      revenueThisMonth,
      toolUsageBreakdown: toolBreakdown,
      aiUsageCount: aiUsageRes.count ?? 0,
      errorCount: errorCountRes.count ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch dashboard stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
