import { describe, expect, it } from "vitest";
import {
  resolveFreeDailyToolLimit,
  resolveMaxFileSizeMB,
  resolveProDailyToolLimit,
} from "@/lib/admin/effective-limits";

describe("effective-limits", () => {
  it("uses admin settings for file size when set", () => {
    expect(resolveMaxFileSizeMB({ pro_max_file_size_mb: "150" }, true)).toBe(150);
    expect(resolveMaxFileSizeMB({ free_max_file_size_mb: "30" }, false)).toBe(30);
  });

  it("falls back to env defaults when admin setting missing", () => {
    expect(resolveMaxFileSizeMB({}, true)).toBe(200);
    expect(resolveMaxFileSizeMB({}, false)).toBe(25);
  });

  it("resolves daily tool limits from settings", () => {
    expect(resolveFreeDailyToolLimit({ free_daily_limit: "7" })).toBe(7);
    expect(resolveProDailyToolLimit({ pro_daily_tool_limit: "120" })).toBe(120);
  });
});
