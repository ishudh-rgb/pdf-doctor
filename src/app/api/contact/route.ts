import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email/contact-mailer";
import { guardGeneralApiRateLimit } from "@/lib/server/rate-limiter";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { validateContactPayload } from "@/lib/validation/contact-validation";
import { captureApiError, toSafeApiError } from "@/lib/server/safe-error";

export async function POST(request: NextRequest) {
  const rateLimited = await guardGeneralApiRateLimit(request);
  if (rateLimited) return rateLimited;

  const originBlocked = guardMutationOrigin(request);
  if (originBlocked) return originBlocked;

  try {
    const body = (await request.json()) as Parameters<typeof validateContactPayload>[0];
    const validated = validateContactPayload(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: validated.status });
    }

    const result = await sendContactEmail(validated.data);

    return NextResponse.json({
      success: true,
      delivered: result.delivered,
      mode: result.mode,
    });
  } catch (err) {
    captureApiError(err, { route: "contact" });
    const message = toSafeApiError(err, "Failed to send message");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
