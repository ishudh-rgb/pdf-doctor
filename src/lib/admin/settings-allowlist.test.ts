import { describe, expect, it } from "vitest";
import {
  canonicalAdminSettingKey,
  isAllowedAdminSettingKey,
  normalizeAdminSettingValue,
} from "./settings-allowlist";

describe("admin settings allowlist", () => {
  it("recognizes allowed keys", () => {
    expect(isAllowedAdminSettingKey("ads_enabled")).toBe(true);
    expect(isAllowedAdminSettingKey("unknown_key")).toBe(false);
  });

  it("canonicalizes legacy keys", () => {
    expect(canonicalAdminSettingKey("free_daily_file_limit")).toBe("free_daily_limit");
    expect(canonicalAdminSettingKey("ads_enabled")).toBe("ads_enabled");
  });

  it("normalizes boolean settings", () => {
    expect(normalizeAdminSettingValue("ads_enabled", true)).toBe("true");
    expect(normalizeAdminSettingValue("maintenance_mode", "0")).toBe("false");
  });

  it("normalizes numeric limits", () => {
    expect(normalizeAdminSettingValue("free_daily_limit", "25")).toBe("25");
    expect(normalizeAdminSettingValue("pro_max_file_size_mb", 200)).toBe("200");
  });

  it("rejects invalid numeric values", () => {
    expect(() => normalizeAdminSettingValue("free_daily_limit", "-1")).toThrow(
      /Invalid numeric value/
    );
    expect(() => normalizeAdminSettingValue("pro_max_file_size_mb", "abc")).toThrow(
      /Invalid file size value/
    );
  });

  it("rejects unsupported keys", () => {
    expect(() => normalizeAdminSettingValue("not_allowed", "1")).toThrow(
      /Unsupported setting key/
    );
  });
});
