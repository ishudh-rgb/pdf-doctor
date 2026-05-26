import { NextRequest, NextResponse } from "next/server";
import { isLocalDevAuthEnabled, localDevVerifyResetCode } from "@/lib/auth/local-dev-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    if (!isLocalDevAuthEnabled()) {
      return NextResponse.json(
        { error: "Code verification is only used in local development mode." },
        { status: 400 }
      );
    }

    const { resetToken } = await localDevVerifyResetCode({ email, code });
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    return NextResponse.json({
      message: "Code verified. Use the reset link to choose a new password.",
      resetUrl,
      resetToken,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Verify reset code error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
