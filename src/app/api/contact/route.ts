import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email/contact-mailer";
import { guardGeneralApiRateLimit } from "@/lib/server/rate-limiter";

const SUBJECTS = new Set(["General", "Billing", "Bug Report", "Feature Request", "Other"]);

export async function POST(request: NextRequest) {
  const rateLimited = await guardGeneralApiRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const subject = body.subject?.trim() ?? "General";
    const message = body.message?.trim() ?? "";

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!SUBJECTS.has(subject)) {
      return NextResponse.json({ error: "Invalid subject." }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters." },
        { status: 400 }
      );
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    const result = await sendContactEmail({ name, email, subject, message });

    return NextResponse.json({
      success: true,
      delivered: result.delivered,
      mode: result.mode,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
