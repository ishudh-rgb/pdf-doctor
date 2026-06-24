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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || "";
    const toolName = searchParams.get("tool_name") || "";

    const offset = (page - 1) * limit;

    const serviceClient = await createServiceClient();
    let query = serviceClient
      .from("tool_jobs")
      .select("*", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (toolName) {
      query = query.eq("tool_name", toolName);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: jobs, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      jobs: jobs ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
