"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ShieldCheck, FileText, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Step = "email" | "verify" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Could not send verification code.");
      }

      if (data.mode === "supabase") {
        setStep("done");
        setResetUrl("");
        return;
      }

      if (data.devCode) {
        setDevCode(data.devCode);
      }

      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Invalid verification code.");
      }

      setResetUrl(data.resetUrl || "");
      setResetToken(data.resetToken || "");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-gray-50 px-4 py-12">
      <div className="mx-auto mt-8 max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-blue-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                PDF <span className="text-red-600">Doctor</span>
              </span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Reset password</h1>
            <p className="text-center text-sm text-gray-500">
              {step === "email" && "Enter your email to receive a verification code"}
              {step === "verify" && "Enter the 6-digit code sent to your email"}
              {step === "done" && "Continue to set your new password"}
            </p>
          </div>

          <div className="mb-6 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
            <span className={cn(step === "email" && "text-blue-600")}>1. Email</span>
            <ArrowRight className="h-3 w-3" />
            <span className={cn(step === "verify" && "text-blue-600")}>2. Verify</span>
            <ArrowRight className="h-3 w-3" />
            <span className={cn(step === "done" && "text-blue-600")}>3. Reset</span>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {devCode && step === "verify" && (
            <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Development mode: your verification code is{" "}
              <span className="font-bold tracking-widest">{devCode}</span>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  loading && "cursor-not-allowed opacity-70"
                )}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Verification Code
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label
                  htmlFor="code"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Verification Code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm tracking-[0.3em] text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  Code sent to {email}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  loading && "cursor-not-allowed opacity-70"
                )}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify Code
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setDevCode("");
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Use a different email
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {resetUrl
                  ? "Verification successful. Open your password reset link to continue."
                  : "If an account exists for this email, a reset link has been sent. Check your inbox."}
              </div>

              {resetUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      resetToken
                        ? `/reset-password?token=${resetToken}`
                        : resetUrl.replace(window.location.origin, "")
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800"
                >
                  Open Reset Link
                </button>
              ) : null}

              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Login
              </Link>
            </div>
          )}

          {step !== "done" && (
            <p className="mt-6 text-center text-sm text-gray-500">
              Remember your password?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
