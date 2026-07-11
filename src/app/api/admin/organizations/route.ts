import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { toSafeApiError } from "@/lib/server/safe-error";

const MAX_PAGE_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );
    const search = (searchParams.get("search") || "").trim();
    const offset = (page - 1) * limit;

    const serviceClient = await createServiceClient();
    let query = serviceClient
      .from("organizations")
      .select("id, name, seat_limit, plan_status, plan_expires_at, created_at", {
        count: "exact",
      });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: organizations, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      organizations: organizations ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    const message = toSafeApiError(err, "Failed to fetch organizations");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
