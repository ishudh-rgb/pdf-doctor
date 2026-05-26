import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const { count, error } = await serviceClient
      .from("uploaded_files")
      .select("id", { count: "exact", head: true })
      .eq("is_deleted", false)
      .lt("expires_at", new Date().toISOString());

    if (error) throw error;

    return NextResponse.json({
      expired_files_count: count ?? 0,
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch cleanup stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const now = new Date().toISOString();

    const { data: expiredFiles, error: fetchError } = await serviceClient
      .from("uploaded_files")
      .select("id")
      .eq("is_deleted", false)
      .lt("expires_at", now);

    if (fetchError) throw fetchError;

    if (!expiredFiles || expiredFiles.length === 0) {
      return NextResponse.json({ cleaned: 0, message: "No expired files to clean up" });
    }

    const fileIds = expiredFiles.map((f) => f.id);
    const { error: updateError } = await serviceClient
      .from("uploaded_files")
      .update({ is_deleted: true })
      .in("id", fileIds);

    if (updateError) throw updateError;

    return NextResponse.json({
      cleaned: fileIds.length,
      cleaned_at: now,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cleanup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
