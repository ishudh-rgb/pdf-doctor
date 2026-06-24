interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface SendContactResult {
  delivered: boolean;
  mode: "email" | "dev";
}

export async function sendContactEmail(
  payload: ContactEmailPayload
): Promise<SendContactResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "OnlyMyPDF <onboarding@resend.dev>";
  const toEmail =
    process.env.CONTACT_INBOX_EMAIL || process.env.ADMIN_EMAIL || "support@onlymypdf.in";

  const safeName = payload.name.trim().slice(0, 120);
  const safeSubject = payload.subject.trim().slice(0, 200);
  const safeMessage = payload.message.trim().slice(0, 5000);

  if (apiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        replyTo: payload.email,
        subject: `[OnlyMyPDF Contact] ${safeSubject}`,
        html: `
          <p><strong>From:</strong> ${escapeHtml(safeName)} &lt;${escapeHtml(payload.email)}&gt;</p>
          <p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
          <hr />
          <p style="white-space:pre-wrap">${escapeHtml(safeMessage)}</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Could not send contact email: ${errorText}`);
    }

    return { delivered: true, mode: "email" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[OnlyMyPDF] Contact form submission (dev mode):", {
      to: toEmail,
      ...payload,
    });
    return { delivered: false, mode: "dev" };
  }

  throw new Error(
    "Email service is not configured. Add RESEND_API_KEY to receive contact messages."
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
