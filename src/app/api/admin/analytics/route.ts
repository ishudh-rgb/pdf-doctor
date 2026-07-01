import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - 7 * 86400000);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    const serviceClient = await createServiceClient();

    const [{ data: usageRows }, { data: aiRows }] = await Promise.all([
      serviceClient
        .from("usage_logs")
        .select("tool_name, created_at, user_id, file_size_bytes")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString()),
      serviceClient
        .from("ai_usage_logs")
        .select("id, tokens_used, created_at, user_id")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString()),
    ]);

    const toolCounts = new Map<string, number>();
    const dailyUsers = new Map<string, Set<string>>();
    const hourCounts = new Map<number, number>();
    const sizeBuckets = new Map<string, number>([
      ["0-1 MB", 0],
      ["1-5 MB", 0],
      ["5-10 MB", 0],
      ["10-25 MB", 0],
      ["25-50 MB", 0],
      ["50+ MB", 0],
    ]);

    for (const row of usageRows ?? []) {
      const tool = row.tool_name ?? "unknown";
      toolCounts.set(tool, (toolCounts.get(tool) ?? 0) + 1);

      const dayKey = row.created_at?.slice(0, 10) ?? "unknown";
      if (!dailyUsers.has(dayKey)) dailyUsers.set(dayKey, new Set());
      if (row.user_id) dailyUsers.get(dayKey)!.add(row.user_id);

      const hour = row.created_at ? new Date(row.created_at).getHours() : 0;
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);

      const mb = (row.file_size_bytes ?? 0) / (1024 * 1024);
      if (mb < 1) sizeBuckets.set("0-1 MB", (sizeBuckets.get("0-1 MB") ?? 0) + 1);
      else if (mb < 5) sizeBuckets.set("1-5 MB", (sizeBuckets.get("1-5 MB") ?? 0) + 1);
      else if (mb < 10) sizeBuckets.set("5-10 MB", (sizeBuckets.get("5-10 MB") ?? 0) + 1);
      else if (mb < 25) sizeBuckets.set("10-25 MB", (sizeBuckets.get("10-25 MB") ?? 0) + 1);
      else if (mb < 50) sizeBuckets.set("25-50 MB", (sizeBuckets.get("25-50 MB") ?? 0) + 1);
      else sizeBuckets.set("50+ MB", (sizeBuckets.get("50+ MB") ?? 0) + 1);
    }

    const totalToolUses = [...toolCounts.values()].reduce((a, b) => a + b, 0);
    const toolUsage = [...toolCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tool, count]) => ({
        tool,
        count,
        percentage: totalToolUses > 0 ? Math.round((count / totalToolUses) * 100) : 0,
      }));

    const dailyActiveUsers = [...dailyUsers.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, users]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: users.size,
      }));

    const aiUserIds = new Set((aiRows ?? []).map((r) => r.user_id).filter(Boolean));
    const totalTokens = (aiRows ?? []).reduce((s, r) => s + (r.tokens_used ?? 0), 0);

    const peakHours = [...hourCounts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([hour, count]) => ({
        hour: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${hour >= 12 ? "PM" : "AM"}`,
        count,
      }));

    const popularTools = toolUsage.slice(0, 5).map((t, i) => ({
      rank: i + 1,
      tool: t.tool,
      uses: t.count,
    }));

    return NextResponse.json({
      dateRange: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
      toolUsage,
      dailyActiveUsers,
      aiStats: {
        totalCalls: aiRows?.length ?? 0,
        totalTokens,
        totalCost: Math.round((totalTokens / 1_000_000) * 0.5 * 100) / 100,
        avgPerUser: aiUserIds.size > 0 ? Math.round(((aiRows?.length ?? 0) / aiUserIds.size) * 10) / 10 : 0,
      },
      fileSizeDistribution: [...sizeBuckets.entries()].map(([range, count]) => ({ range, count })),
      popularTools,
      peakHours,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
