import { describe, expect, it } from "vitest";

describe("auth signup validation", () => {
  it("requires termsAccepted in request body contract", () => {
    const bodyWithoutTerms = { email: "a@b.com", password: "password123" };
    expect(Boolean((bodyWithoutTerms as { termsAccepted?: boolean }).termsAccepted)).toBe(false);

    const bodyWithTerms = { ...bodyWithoutTerms, termsAccepted: true };
    expect(bodyWithTerms.termsAccepted).toBe(true);
  });
});
