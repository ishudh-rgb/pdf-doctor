import { FILE_LIMITS } from "@/config/constants";

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  const n = Number(String(value ?? "").trim());
  if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  return fallback;
}

/** File size limits — admin_settings override env defaults (no conversion logic). */
export function resolveMaxFileSizeMB(
  settings: Record<string, unknown>,
  isPro: boolean
): number {
  const envDefault = isPro
    ? FILE_LIMITS.maxProFileSizeMB
    : FILE_LIMITS.maxFreeFileSizeMB;

  const key = isPro ? "pro_max_file_size_mb" : "free_max_file_size_mb";
  const fromSettings = settings[key];
  if (fromSettings === undefined || fromSettings === null || fromSettings === "") {
    return envDefault;
  }
  return parsePositiveInt(fromSettings, envDefault);
}

export function resolveFreeDailyToolLimit(settings: Record<string, unknown>): number {
  const raw = settings.free_daily_limit ?? settings.free_daily_file_limit;
  return parsePositiveInt(raw, FILE_LIMITS.maxFreeUsesPerDay);
}

export function resolveProDailyToolLimit(settings: Record<string, unknown>): number {
  return parsePositiveInt(settings.pro_daily_tool_limit, FILE_LIMITS.maxProUsesPerDay);
}
