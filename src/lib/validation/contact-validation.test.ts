import { describe, expect, it } from "vitest";
import {
  getContactFieldErrors,
  validateContactPayload,
  CONTACT_FIELD_ERROR_KEYS,
} from "@/lib/validation/contact-validation";

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

  it("rejects short name with field error key", () => {
    const result = validateContactPayload({
      name: "J",
      email: "jane@example.com",
      message: "Hello world!!!",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.fieldErrors?.name).toBe(CONTACT_FIELD_ERROR_KEYS.name);
    }
  });

  it("rejects invalid email with field error key", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "not-an-email",
      message: "Hello world!!!",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.email).toBe(CONTACT_FIELD_ERROR_KEYS.email);
    }
  });

  it("rejects invalid subject with field error key", () => {
    const result = validateContactPayload({
      name: "Jane",
      email: "jane@example.com",
      subject: "Spam",
      message: "Hello world!!!",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.subject).toBe(CONTACT_FIELD_ERROR_KEYS.subject);
    }
  });

  it("rejects message that is too long", () => {
    const errors = getContactFieldErrors({
      name: "Jane Doe",
      email: "jane@example.com",
      subject: "General",
      message: "x".repeat(5001),
    });
    expect(errors.message).toBe("contact.errors.messageTooLong");
  });
});
