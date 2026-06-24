import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient.from("admin_settings").select("*");

    if (error) throw error;

    return NextResponse.json({ settings: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from("admin_settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ setting: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update setting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
