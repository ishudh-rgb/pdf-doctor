const ALLOWED_ADMIN_SETTING_KEYS = new Set([
  "free_daily_limit",
  "free_daily_file_limit",
  "free_max_file_size_mb",
  "pro_max_file_size_mb",
  "free_daily_ai_limit",
  "ads_enabled",
  "maintenance_mode",
  "file_retention_hours",
]);

export function isAllowedAdminSettingKey(key: string): boolean {
  return ALLOWED_ADMIN_SETTING_KEYS.has(key);
}

export function normalizeAdminSettingValue(key: string, value: unknown): string {
  const raw = String(value ?? "").trim();

  if (key === "ads_enabled" || key === "maintenance_mode") {
    const enabled = raw === "true" || raw === "1" || value === true;
    return enabled ? "true" : "false";
  }

  if (
    key === "free_daily_limit" ||
    key === "free_daily_file_limit" ||
    key === "free_daily_ai_limit" ||
    key === "file_retention_hours"
  ) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`Invalid numeric value for ${key}`);
    }
    return String(Math.floor(n));
  }

  if (key === "free_max_file_size_mb" || key === "pro_max_file_size_mb") {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`Invalid file size value for ${key}`);
    }
    return String(Math.floor(n));
  }

  throw new Error(`Unsupported setting key: ${key}`);
}

/** Map legacy admin UI keys to runtime keys. */
export function canonicalAdminSettingKey(key: string): string {
  if (key === "free_daily_file_limit") return "free_daily_limit";
  return key;
}
