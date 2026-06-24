interface SendCodeResult {
  delivered: boolean;
  mode: "email" | "dev";
  devCode?: string;
}

export async function sendPasswordResetCode(
  email: string,
  code: string
): Promise<SendCodeResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Only4PDF <onboarding@resend.dev>";

  if (apiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Your Only4PDF password reset code",
        html: `
          <p>Your password reset verification code is:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
          <p>This code expires in 10 minutes.</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Could not send email: ${errorText}`);
    }

    return { delivered: true, mode: "email" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[OnlyMyPDF] Password reset code issued (dev mode only)");
    return { delivered: false, mode: "dev", devCode: code };
  }

  throw new Error(
    "Email service is not configured. Add RESEND_API_KEY to send reset codes."
  );
}
