const SUBJECTS = new Set(["General", "Billing", "Bug Report", "Feature Request", "Other"]);

export type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export type ContactValidationResult =
  | { ok: true; data: { name: string; email: string; subject: string; message: string } }
  | { ok: false; error: string; status: number };

export function validateContactPayload(body: ContactPayload): ContactValidationResult {
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const subject = body.subject?.trim() ?? "General";
  const message = body.message?.trim() ?? "";

  if (!name || name.length < 2) {
    return { ok: false, error: "Name is required.", status: 400 };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "A valid email is required.", status: 400 };
  }
  if (!SUBJECTS.has(subject)) {
    return { ok: false, error: "Invalid subject.", status: 400 };
  }
  if (!message || message.length < 10) {
    return { ok: false, error: "Message must be at least 10 characters.", status: 400 };
  }
  if (message.length > 5000) {
    return { ok: false, error: "Message is too long.", status: 400 };
  }

  return { ok: true, data: { name, email, subject, message } };
}
