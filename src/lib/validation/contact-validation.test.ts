import { describe, expect, it } from "vitest";
import { validateContactPayload } from "@/lib/validation/contact-validation";

describe("validateContactPayload", () => {
  it("accepts valid payload", () => {
    const result = validateContactPayload({
      name: "Jane Doe",
      email: "jane@example.com",
      subject: "General",
      message: "Hello, I need help with merge PDF.",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("jane@example.com");
    }
  });

  it("rejects short name", () => {
    const result = validateContactPayload({
      name: "J",
      email: "jane@example.com",
      message: "Hello world!!!",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects invalid email", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "not-an-email",
      message: "Hello world!!!",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid subject", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "jane@example.com",
      subject: "Spam",
      message: "Hello world!!!",
    });
    expect(result.ok).toBe(false);
  });
});
