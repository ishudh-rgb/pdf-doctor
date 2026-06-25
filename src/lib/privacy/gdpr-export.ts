export const GDPR_EXPORT_FORMAT = "onlymypdf-gdpr-export-v2";

export type GdprExportSection =
  | "account"
  | "profile"
  | "tool_jobs"
  | "payments"
  | "subscriptions"
  | "consent_records"
  | "usage_logs"
  | "ai_usage_logs"
  | "uploaded_files";

export const GDPR_EXPORT_SECTIONS: GdprExportSection[] = [
  "account",
  "profile",
  "tool_jobs",
  "payments",
  "subscriptions",
  "consent_records",
  "usage_logs",
  "ai_usage_logs",
  "uploaded_files",
];

export function buildGdprExportPayload(data: {
  user: { id: string; email?: string | null; plan?: string | null };
  profile: Record<string, unknown> | null;
  toolJobs: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  consentRecords: Record<string, unknown>[];
  usageLogs: Record<string, unknown>[];
  aiUsageLogs: Record<string, unknown>[];
  uploadedFiles: Record<string, unknown>[];
}) {
  return {
    exported_at: new Date().toISOString(),
    format: GDPR_EXPORT_FORMAT,
    sections_included: GDPR_EXPORT_SECTIONS,
    account: {
      id: data.user.id,
      email: data.user.email,
      plan: data.user.plan,
    },
    profile: data.profile,
    tool_jobs: data.toolJobs,
    payments: data.payments,
    subscriptions: data.subscriptions,
    consent_records: data.consentRecords,
    usage_logs: data.usageLogs,
    ai_usage_logs: data.aiUsageLogs,
    uploaded_files: data.uploadedFiles,
  };
}
