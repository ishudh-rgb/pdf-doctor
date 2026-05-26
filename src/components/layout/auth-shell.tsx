"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n";

interface AuthShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden mesh-hero">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl"
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl lg:grid-cols-2">
        <div className="hidden flex-col justify-center px-8 py-12 lg:flex xl:px-12">
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">
              PDF{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Doctor
              </span>
            </span>
          </Link>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 xl:text-4xl">
            {t("landing.heroTitle")}{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {t("landing.heroTitleHighlight")}
            </span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
            {t("landing.heroSubtitle")}
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-2 shadow-xl shadow-indigo-500/10 backdrop-blur-sm">
            <Image
              src="/images/hero-product-main.webp"
              alt="PDF Doctor product preview"
              width={800}
              height={500}
              loading="lazy"
              sizes="(max-width: 1024px) 0px, 400px"
              className="h-auto w-full rounded-xl object-cover object-top"
            />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500">
            <Sparkles className="h-4 w-4 text-violet-500" />
            {t("landing.heroTrust")}
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:py-12">
          <div className="w-full max-w-md">
            {(title || subtitle) && (
              <div className="mb-6 text-center lg:hidden">
                {title && (
                  <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                )}
                {subtitle && (
                  <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
                )}
              </div>
            )}

            <div className="glass-panel rounded-2xl p-6 shadow-xl shadow-indigo-500/5 sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
