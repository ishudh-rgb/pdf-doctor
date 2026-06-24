import { FILE_LIMITS } from "@/config/constants";

const PRO_RETENTION_HOURS = 24;

export function fileRetentionHoursForPlan(plan: "free" | "pro" | string | null | undefined): number {
  if (plan === "pro") return PRO_RETENTION_HOURS;
  return FILE_LIMITS.fileRetentionHours;
}

export function computeFileExpiresAt(retentionHours: number): string {
  return new Date(Date.now() + retentionHours * 60 * 60 * 1000).toISOString();
}
