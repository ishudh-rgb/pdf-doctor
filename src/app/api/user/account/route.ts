import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import {
  getUserJobs,
  getUserProfile,
  getUserUploadedFilePaths,
  markFileDeleted,
  deleteUserConsentRecords,
  getUserConsentRecords,
  getUserUsageLogsForExport,
  getUserAiUsageLogsForExport,
  getUserUploadedFilesMetadata,
} from "@/lib/db/queries";
import { deleteFile } from "@/lib/services/upload.service";
import { guardGeneralApiRateLimit } from "@/lib/server/rate-limiter";
import { toSafeApiError, captureApiError } from "@/lib/server/safe-error";
import { buildGdprExportPayload } from "@/lib/privacy/gdpr-export";

export async function DELETE(request: NextRequest) {
  const rateLimited = await guardGeneralApiRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const supabase = await createServiceClient();

    const files = await getUserUploadedFilePaths(user.id);
    for (const file of files) {
      try {
        await deleteFile(file.storage_path);
        await markFileDeleted(file.id);
      } catch {
        await markFileDeleted(file.id);
      }
    }

    await supabase.from("tool_jobs").delete().eq("user_id", user.id);
    await supabase.from("usage_logs").delete().eq("user_id", user.id);
    await supabase.from("ai_usage_logs").delete().eq("user_id", user.id);
    await deleteUserConsentRecords(user.id);
    await supabase.from("user_profiles").delete().eq("id", user.id);

    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError) {
      return NextResponse.json(
        { error: "Account deletion failed. Contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Your account and personal data have been deleted. Anonymized billing records may be retained as required by law.",
    });
  } catch (error) {
    captureApiError(error, { route: "user/account", method: "DELETE" });
    const message = toSafeApiError(error, "Failed to delete account");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await guardGeneralApiRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const profile = await getUserProfile(user.id);
    const jobs = await getUserJobs(user.id, 100);

    const [
      { data: payments },
      { data: subscriptions },
      consentRecords,
      usageLogs,
      aiUsageLogs,
      uploadedFiles,
    ] = await Promise.all([
      supabase
        .from("payments")
        .select("id, amount, currency, status, created_at, plan_tier")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("subscriptions")
        .select("id, plan_tier, status, current_period_end, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      getUserConsentRecords(user.id),
      getUserUsageLogsForExport(user.id),
      getUserAiUsageLogsForExport(user.id),
      getUserUploadedFilesMetadata(user.id),
    ]);

    const exportPayload = buildGdprExportPayload({
      user: { id: user.id, email: user.email, plan: user.plan },
      profile: profile
        ? {
            full_name: profile.full_name,
            preferred_language: profile.preferred_language,
            usage_count_today: profile.usage_count_today,
            total_usage_count: profile.total_usage_count,
            created_at: profile.created_at,
          }
        : null,
      toolJobs: jobs.map((j: Record<string, unknown>) => ({
        id: j.id,
        tool_name: j.tool_name,
        status: j.status,
        created_at: j.created_at,
        completed_at: j.completed_at,
        file_size_bytes: j.file_size_bytes,
      })),
      payments: payments ?? [],
      subscriptions: subscriptions ?? [],
      consentRecords,
      usageLogs,
      aiUsageLogs,
      uploadedFiles,
    });

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="onlymypdf-data-export-${user.id.slice(0, 8)}.json"`,
      },
    });
  } catch (error) {
    captureApiError(error, { route: "user/account", method: "GET" });
    const message = toSafeApiError(error, "Failed to export data");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
