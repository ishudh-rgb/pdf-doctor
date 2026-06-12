"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDesignPreview } from "@/components/design/design-preview-provider";
import { useTranslation } from "@/i18n";

interface AuthShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  const { t } = useTranslation();
  const { layoutStyle } = useDesignPreview();

  return (
    <section className="relative min-h-[calc(100vh-var(--pd-header-height))] overflow-hidden bg-pd-background">
      <div
        className={cn(
          "pd-auth-shell relative mx-auto grid min-h-[calc(100vh-var(--pd-header-height))] max-w-6xl lg:grid-cols-2",
          layoutStyle === "D" && "max-w-2xl lg:grid-cols-1"
        )}
      >
        <div
          className={cn(
            "pd-auth-shell-promo hidden flex-col justify-center px-8 py-12 lg:flex xl:px-12",
            layoutStyle === "C" && "bg-pd-brand text-white"
          )}
        >
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl shadow-md",
                layoutStyle === "C" ? "bg-white/20" : "bg-pd-brand"
              )}
            >
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span
              className={cn(
                "text-2xl font-bold",
                layoutStyle === "C" ? "text-white" : "text-pd-foreground"
              )}
            >
              Only
              <span className={layoutStyle === "C" ? "text-white/90" : "text-pd-brand"}>
                4
              </span>
              PDF
            </span>
          </Link>

          <h2
            className={cn(
              "text-3xl font-bold tracking-tight xl:text-4xl",
              layoutStyle === "C" ? "text-white" : "text-pd-foreground"
            )}
          >
            {t("landing.heroTitle")}{" "}
            <span className={layoutStyle === "C" ? "text-white/90" : "text-pd-brand"}>
              {t("landing.heroTitleHighlight")}
            </span>
          </h2>
          <p
            className={cn(
              "mt-4 max-w-md text-base leading-relaxed",
              layoutStyle === "C" ? "text-white/85" : "text-pd-muted"
            )}
          >
            {t("landing.heroSubtitle")}
          </p>

          {layoutStyle !== "A" && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-pd-border bg-pd-surface p-2 shadow-lg">
              <Image
                src="/images/hero-product-main.webp"
                alt="Only4PDF product preview"
                width={800}
                height={500}
                loading="lazy"
                sizes="(max-width: 1024px) 0px, 400px"
                className="h-auto w-full rounded-xl object-cover object-top"
              />
            </div>
          )}

          <div
            className={cn(
              "mt-6 inline-flex items-center gap-2 text-sm",
              layoutStyle === "C" ? "text-white/80" : "text-pd-muted"
            )}
          >
            <Sparkles className={cn("h-4 w-4", layoutStyle === "C" ? "text-white" : "text-pd-brand")} />
            {t("landing.heroTrust")}
          </div>
        </div>

        <div className="pd-auth-shell-form flex items-center justify-center px-4 py-10 sm:px-6 lg:py-12">
          <div className="w-full max-w-md">
            {(title || subtitle) && (
              <div className="mb-6 text-center lg:hidden">
                {title && <h1 className="text-2xl font-bold text-pd-foreground">{title}</h1>}
                {subtitle && <p className="mt-2 text-sm text-pd-muted">{subtitle}</p>}
              </div>
            )}

            <div className="rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-lg sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
