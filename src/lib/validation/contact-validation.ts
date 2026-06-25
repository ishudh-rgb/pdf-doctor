const SUBJECTS = new Set(["General", "Billing", "Bug Report", "Feature Request", "Other"]);

export type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export type ContactValidationResult =
  | { ok: true; data: { name: string; email: string; subject: string; message: string } }
  | { ok: false; error: string; status: number; fieldErrors?: ContactFieldErrors };

export type ContactFieldErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;

/** i18n keys for contact form field errors (use with t()). */
export const CONTACT_FIELD_ERROR_KEYS: ContactFieldErrors = {
  name: "contact.errors.nameRequired",
  email: "contact.errors.emailInvalid",
  subject: "contact.errors.subjectInvalid",
  message: "contact.errors.messageRequired",
};

export function getContactFieldErrors(body: ContactPayload): ContactFieldErrors {
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const subject = body.subject?.trim() ?? "General";
  const message = body.message?.trim() ?? "";

  const errors: ContactFieldErrors = {};

  if (!name || name.length < 2) {
    errors.name = CONTACT_FIELD_ERROR_KEYS.name;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = CONTACT_FIELD_ERROR_KEYS.email;
  }
  if (!SUBJECTS.has(subject)) {
    errors.subject = CONTACT_FIELD_ERROR_KEYS.subject;
  }
  if (!message || message.length < 10) {
    errors.message = CONTACT_FIELD_ERROR_KEYS.message;
  } else if (message.length > 5000) {
    errors.message = "contact.errors.messageTooLong";
  }

  return errors;
}

export function validateContactPayload(body: ContactPayload): ContactValidationResult {
  const fieldErrors = getContactFieldErrors(body);
  const keys = Object.keys(fieldErrors) as (keyof ContactFieldErrors)[];
  if (keys.length > 0) {
    const firstKey = keys[0];
    const fallbackMessages: Record<string, string> = {
      name: "Name is required.",
      email: "A valid email is required.",
      subject: "Invalid subject.",
      message: "Message must be at least 10 characters.",
    };
    return {
      ok: false,
      error: fallbackMessages[firstKey] ?? "Invalid form data.",
      status: 400,
      fieldErrors,
    };
  }

  const name = body.name!.trim();
  const email = body.email!.trim();
  const subject = body.subject?.trim() ?? "General";
  const message = body.message!.trim();

  return { ok: true, data: { name, email, subject, message } };
}
