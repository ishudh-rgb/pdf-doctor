import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "./cron-auth";

describe("isCronAuthorized", () => {
  const secret = "test-secret";

  it("accepts bearer token", () => {
    expect(isCronAuthorized(`Bearer ${secret}`, null, null, secret)).toBe(true);
  });

  it("accepts query secret", () => {
    expect(isCronAuthorized(null, secret, null, secret)).toBe(true);
  });

  it("accepts vercel cron header", () => {
    expect(isCronAuthorized(null, null, "1", secret)).toBe(true);
  });

  it("rejects missing secret", () => {
    expect(isCronAuthorized(`Bearer ${secret}`, null, null, undefined)).toBe(false);
  });
});
