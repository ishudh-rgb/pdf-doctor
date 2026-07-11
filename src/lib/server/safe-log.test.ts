import { describe, expect, it } from "vitest";
import { REDACTED, redactSensitiveText, safeErrorMessage } from "./safe-log";

describe("safe-log", () => {
  it("redacts emails and bearer tokens", () => {
    const input = "user@test.com failed with bearer secret-token-123";
    expect(redactSensitiveText(input)).toContain(REDACTED);
    expect(redactSensitiveText(input)).not.toContain("user@test.com");
  });

  it("returns a redacted safe error message", () => {
    const err = new Error("Reset failed for admin@example.com");
    expect(safeErrorMessage(err)).toBe(`Reset failed for ${REDACTED}`);
  });
});
