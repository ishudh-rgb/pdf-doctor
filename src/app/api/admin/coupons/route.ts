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

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from("coupon_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ coupons: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch coupons";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { code, discount_percent, max_uses, valid_until } = await request.json();

    if (!code || !discount_percent) {
      return NextResponse.json({ error: "Code and discount_percent are required" }, { status: 400 });
    }

    if (discount_percent < 1 || discount_percent > 100) {
      return NextResponse.json({ error: "Discount must be between 1 and 100" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from("coupon_codes")
      .insert({
        code: code.toUpperCase(),
        discount_percent,
        max_uses: max_uses ?? -1,
        valid_until: valid_until ?? null,
        is_active: true,
        times_used: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ coupon: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create coupon";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, is_active } = await request.json();

    if (!id || is_active === undefined) {
      return NextResponse.json({ error: "id and is_active are required" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from("coupon_codes")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ coupon: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update coupon";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
