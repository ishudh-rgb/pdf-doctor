import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get("secret");
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized =
      secretParam === cronSecret ||
      authHeader === `Bearer ${cronSecret}`;

    if (!cronSecret || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const now = new Date().toISOString();

    const { data: expiredFiles, error: fetchError } = await supabase
      .from("uploaded_files")
      .select("id")
      .eq("is_deleted", false)
      .lt("expires_at", now);

    if (fetchError) throw fetchError;

    if (!expiredFiles || expiredFiles.length === 0) {
      return NextResponse.json({ cleaned: 0, message: "No expired files found" });
    }

    const fileIds = expiredFiles.map((f) => f.id);
    const { error: updateError } = await supabase
      .from("uploaded_files")
      .update({ is_deleted: true })
      .in("id", fileIds);

    if (updateError) throw updateError;

    return NextResponse.json({
      cleaned: fileIds.length,
      cleaned_at: now,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cleanup cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
