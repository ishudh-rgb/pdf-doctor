import { createServiceClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// User Profiles
// ---------------------------------------------------------------------------

export async function getUserProfile(userId: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  data: Record<string, unknown>
) {
  const supabase = await createServiceClient();
  const { data: updated, error } = await supabase
    .from("user_profiles")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

// ---------------------------------------------------------------------------
// Tool Jobs
// ---------------------------------------------------------------------------

export async function createToolJob(data: {
  user_id?: string | null;
  guest_session_id?: string | null;
  tool_name: string;
  input_files?: unknown[];
  options?: Record<string, unknown>;
  file_size_bytes?: number;
}) {
  const supabase = await createServiceClient();
  const { data: job, error } = await supabase
    .from("tool_jobs")
    .insert({
      user_id: data.user_id ?? null,
      guest_session_id: data.guest_session_id ?? null,
      tool_name: data.tool_name,
      status: "pending",
      input_files: data.input_files ?? [],
      options: data.options ?? {},
      file_size_bytes: data.file_size_bytes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return job;
}

export async function updateToolJob(
  jobId: string,
  data: Record<string, unknown>
) {
  const supabase = await createServiceClient();
  const { data: updated, error } = await supabase
    .from("tool_jobs")
    .update(data)
    .eq("id", jobId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

export async function getToolJob(jobId: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tool_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserJobs(userId: string, limit = 20) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tool_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Uploaded Files
// ---------------------------------------------------------------------------

export async function createUploadedFile(data: {
  user_id?: string | null;
  guest_session_id?: string | null;
  job_id?: string | null;
  original_name: string;
  stored_name: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  file_type?: "input" | "output";
}) {
  const supabase = await createServiceClient();
  const { data: file, error } = await supabase
    .from("uploaded_files")
    .insert({
      user_id: data.user_id ?? null,
      guest_session_id: data.guest_session_id ?? null,
      job_id: data.job_id ?? null,
      original_name: data.original_name,
      stored_name: data.stored_name,
      storage_path: data.storage_path,
      mime_type: data.mime_type,
      file_size_bytes: data.file_size_bytes,
      file_type: data.file_type ?? "input",
    })
    .select()
    .single();

  if (error) throw error;
  return file;
}

export async function getUploadedFile(fileId: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("uploaded_files")
    .select("*")
    .eq("id", fileId)
    .single();

  if (error) throw error;
  return data;
}

export async function markFileDeleted(fileId: string) {
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("uploaded_files")
    .update({ is_deleted: true })
    .eq("id", fileId);

  if (error) throw error;
}

export async function getExpiredFiles() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("uploaded_files")
    .select("*")
    .eq("is_deleted", false)
    .lt("expires_at", new Date().toISOString());

  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Usage Logs
// ---------------------------------------------------------------------------

export async function logUsage(data: {
  user_id?: string | null;
  guest_ip_hash?: string | null;
  tool_name: string;
  file_size_bytes?: number | null;
  processing_time_ms?: number | null;
  status: "success" | "failed";
}) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("usage_logs").insert({
    user_id: data.user_id ?? null,
    guest_ip_hash: data.guest_ip_hash ?? null,
    tool_name: data.tool_name,
    file_size_bytes: data.file_size_bytes ?? null,
    processing_time_ms: data.processing_time_ms ?? null,
    status: data.status,
  });

  if (error) throw error;
}

export async function logAIUsage(data: {
  user_id: string;
  tool_name?: string;
  input_tokens?: number | null;
  output_tokens?: number | null;
  estimated_cost?: number | null;
  provider?: string;
  model?: string | null;
  status: "success" | "failed";
}) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("ai_usage_logs").insert({
    user_id: data.user_id,
    tool_name: data.tool_name ?? "ai-pdf-summarizer",
    input_tokens: data.input_tokens ?? null,
    output_tokens: data.output_tokens ?? null,
    estimated_cost: data.estimated_cost ?? null,
    provider: data.provider ?? "gemini",
    model: data.model ?? null,
    status: data.status,
  });

  if (error) throw error;
}

export async function getUserDailyUsage(userId: string, toolName?: string) {
  const supabase = await createServiceClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let query = supabase
    .from("usage_logs")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("status", "success")
    .gte("created_at", todayStart.toISOString());

  if (toolName) {
    query = query.eq("tool_name", toolName);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getGuestDailyUsage(ipHash: string) {
  const supabase = await createServiceClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("usage_logs")
    .select("id", { count: "exact" })
    .eq("guest_ip_hash", ipHash)
    .eq("status", "success")
    .gte("created_at", todayStart.toISOString());

  if (error) throw error;
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Admin Settings
// ---------------------------------------------------------------------------

export async function getAdminSettings() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from("admin_settings").select("*");

  if (error) throw error;

  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function updateAdminSetting(key: string, value: unknown) {
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("admin_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) throw error;
}

export async function getAdminDashboardStats() {
  const supabase = await createServiceClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [
    { count: totalUsers },
    { count: totalJobs },
    { count: todayJobs },
    { count: totalPayments },
    { data: revenueData },
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true }),
    supabase.from("tool_jobs").select("id", { count: "exact", head: true }),
    supabase
      .from("tool_jobs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "completed"),
  ]);

  const totalRevenue =
    revenueData?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return {
    totalUsers: totalUsers ?? 0,
    totalJobs: totalJobs ?? 0,
    todayJobs: todayJobs ?? 0,
    totalPayments: totalPayments ?? 0,
    totalRevenue,
  };
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function createPayment(data: {
  user_id: string;
  subscription_id?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  amount: number;
  currency?: string;
  status?: "pending" | "completed" | "failed" | "refunded";
  payment_method?: string | null;
}) {
  const supabase = await createServiceClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: data.user_id,
      subscription_id: data.subscription_id ?? null,
      razorpay_order_id: data.razorpay_order_id ?? null,
      razorpay_payment_id: data.razorpay_payment_id ?? null,
      razorpay_signature: data.razorpay_signature ?? null,
      amount: data.amount,
      currency: data.currency ?? "INR",
      status: data.status ?? "pending",
      payment_method: data.payment_method ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return payment;
}

export async function updatePayment(
  paymentId: string,
  data: Record<string, unknown>
) {
  const supabase = await createServiceClient();
  const { data: updated, error } = await supabase
    .from("payments")
    .update(data)
    .eq("id", paymentId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export async function getUserSubscription(userId: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("user_id", userId)
    .in("status", ["active", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createSubscription(data: {
  user_id: string;
  plan_id: string;
  status?: string;
  razorpay_subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
}) {
  const supabase = await createServiceClient();
  const { data: sub, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: data.user_id,
      plan_id: data.plan_id,
      status: data.status ?? "active",
      razorpay_subscription_id: data.razorpay_subscription_id ?? null,
      current_period_start: data.current_period_start ?? new Date().toISOString(),
      current_period_end: data.current_period_end ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return sub;
}

export async function updateSubscription(
  subId: string,
  data: Record<string, unknown>
) {
  const supabase = await createServiceClient();
  const { data: updated, error } = await supabase
    .from("subscriptions")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", subId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

// ---------------------------------------------------------------------------
// Coupon Codes
// ---------------------------------------------------------------------------

export async function getCouponCode(code: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("coupon_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  const now = new Date();
  if (data.valid_until && new Date(data.valid_until) < now) return null;
  if (data.max_uses !== -1 && data.times_used >= data.max_uses) return null;

  return data;
}

// ---------------------------------------------------------------------------
// Error Logging
// ---------------------------------------------------------------------------

// Aliases for backward compatibility with API routes
export const logToolUsage = async (data: {
  userId?: string | null;
  sessionId?: string | null;
  toolSlug?: string;
  ipAddress?: string | null;
  fileSize?: number;
  processingTimeMs?: number;
  status?: string;
}) => {
  return logUsage({
    user_id: data.userId ?? null,
    guest_ip_hash: data.ipAddress ?? null,
    tool_name: data.toolSlug ?? "unknown",
    file_size_bytes: data.fileSize ?? null,
    processing_time_ms: data.processingTimeMs ?? null,
    status: (data.status === "completed" ? "success" : data.status === "failed" ? "failed" : "success") as "success" | "failed",
  });
};

export const createUploadedFileRecord = createUploadedFile;
export const getUploadedFileById = getUploadedFile;
export const deleteUploadedFileRecord = markFileDeleted;

export async function logError(data: {
  user_id?: string | null;
  tool_name?: string | null;
  error_type: string;
  error_message: string;
  stack_trace?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createServiceClient();
    await supabase.from("error_logs").insert({
      user_id: data.user_id ?? null,
      tool_name: data.tool_name ?? null,
      error_type: data.error_type,
      error_message: data.error_message,
      stack_trace: data.stack_trace ?? null,
      metadata: data.metadata ?? {},
    });
  } catch {
    console.error("Failed to log error to database:", data.error_message);
  }
}
