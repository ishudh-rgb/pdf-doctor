import { describe, expect, it } from "vitest";
import { buildGdprExportPayload, GDPR_EXPORT_SECTIONS } from "@/lib/privacy/gdpr-export";

describe("buildGdprExportPayload", () => {
  it("includes all GDPR export sections", () => {
    const payload = buildGdprExportPayload({
      user: { id: "u1", email: "a@b.com", plan: "free" },
      profile: { full_name: "Test" },
      toolJobs: [{ id: "j1" }],
      payments: [],
      subscriptions: [],
      consentRecords: [{ id: "c1" }],
      usageLogs: [{ id: "l1" }],
      aiUsageLogs: [{ id: "a1" }],
      uploadedFiles: [{ id: "f1" }],
    });

    expect(payload.format).toBe("onlymypdf-gdpr-export-v2");
    expect(payload.sections_included).toEqual(GDPR_EXPORT_SECTIONS);
    expect(payload.consent_records).toHaveLength(1);
    expect(payload.usage_logs).toHaveLength(1);
    expect(payload.ai_usage_logs).toHaveLength(1);
    expect(payload.uploaded_files).toHaveLength(1);
  });
});
