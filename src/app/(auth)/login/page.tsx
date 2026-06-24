"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { useTranslation } from "@/i18n";

const inputClass =
  "w-full rounded-xl border border-pd-border bg-pd-surface py-2.5 text-sm text-pd-foreground outline-none transition focus:border-pd-brand focus:ring-2 focus:ring-pd-brand/20";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("message");
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid email or password. Please try again.");
      }

      window.location.assign(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <div className="mb-6 hidden flex-col items-center gap-2 lg:flex">
        <Logo variant="icon" />
        <h1 className="text-xl font-bold text-pd-foreground">{t("auth.loginTitle")}</h1>
        <p className="text-sm text-pd-muted">{t("auth.loginSubtitle")}</p>
      </div>

      {successMessage && (
        <div
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-pd-foreground">
            {t("auth.email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pd-muted" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(inputClass, "pl-10 pr-4")}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-pd-foreground">
            {t("auth.password")}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pd-muted" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(inputClass, "pl-10 pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-pd-muted hover:text-pd-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-pd-brand hover:text-pd-brand-hover">
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("auth.loginButton")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-pd-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-pd-brand hover:text-pd-brand-hover">
          {t("auth.signupLink")}
        </Link>
      </p>
    </AuthShell>
  );
}
