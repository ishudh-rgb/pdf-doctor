interface SendInviteResult {
  delivered: boolean;
  mode: "email" | "dev";
}

export async function sendOrganizationInviteEmail(input: {
  to: string;
  organizationName: string;
  acceptUrl: string;
  inviterEmail?: string;
}): Promise<SendInviteResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "OnlyMyPDF <onboarding@resend.dev>";

  const html = `
    <p>You have been invited to join <strong>${input.organizationName}</strong> on OnlyMyPDF.</p>
    ${input.inviterEmail ? `<p>Invited by: ${input.inviterEmail}</p>` : ""}
    <p><a href="${input.acceptUrl}" style="display:inline-block;padding:12px 20px;background:#DC2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Accept invitation</a></p>
    <p style="font-size:12px;color:#666;">Or copy this link: ${input.acceptUrl}</p>
    <p style="font-size:12px;color:#666;">This invite expires in 7 days.</p>
  `;

  if (apiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.to],
        subject: `Join ${input.organizationName} on OnlyMyPDF`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Could not send invite email: ${errorText}`);
    }

    return { delivered: true, mode: "email" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[OnlyMyPDF] Org invite URL (dev):", input.acceptUrl);
    return { delivered: false, mode: "dev" };
  }

  throw new Error(
    "Email service is not configured. Add RESEND_API_KEY to send team invites."
  );
}
