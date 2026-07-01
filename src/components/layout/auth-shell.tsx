"use client";



import Link from "next/link";

import { ArrowRight, Brain, Crown, PenTool, ShieldCheck, Zap } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import { Button } from "@/components/ui/button";

import { useDesignPreview } from "@/components/design/design-preview-provider";

import { useTranslation } from "@/i18n";



interface AuthShellProps {

  children: React.ReactNode;

  title?: string;

  subtitle?: string;

}



const PRO_BENEFITS = [

  { icon: Brain, titleKey: "auth.promo.benefit1Title", descKey: "auth.promo.benefit1Desc", accent: "from-violet-500 to-purple-600" },

  { icon: PenTool, titleKey: "auth.promo.benefit2Title", descKey: "auth.promo.benefit2Desc", accent: "from-rose-500 to-pink-600" },

  { icon: Zap, titleKey: "auth.promo.benefit3Title", descKey: "auth.promo.benefit3Desc", accent: "from-amber-500 to-orange-500" },

] as const;



export function AuthShell({ children, title, subtitle }: AuthShellProps) {

  const { t } = useTranslation();

  const { layoutStyle } = useDesignPreview();

  const isBrandPanel = layoutStyle === "C";



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

            "pd-auth-shell-promo hidden flex-col justify-center px-8 py-12 lg:flex xl:px-14",

            isBrandPanel && "bg-pd-brand text-white"

          )}

        >

          <div className="w-full max-w-none pr-2 xl:pr-6">
            <p
              className={cn(
                "mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide",
                isBrandPanel
                  ? "bg-white/15 text-white ring-1 ring-white/25"
                  : "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 ring-1 ring-amber-200/80"
              )}
            >
              <Crown className="h-3.5 w-3.5 shrink-0" />
              {t("auth.promo.badge")}
            </p>

            <h2
              className={cn(
                "text-[1.625rem] font-bold leading-[1.2] tracking-tight lg:text-[1.75rem] lg:whitespace-nowrap xl:text-[1.875rem]",
                isBrandPanel ? "text-white" : "text-pd-foreground"
              )}
            >
              {t("auth.promo.title")}{" "}
              <span
                className={
                  isBrandPanel
                    ? "text-white/90"
                    : "bg-gradient-to-r from-blue-600 via-violet-500 to-rose-500 bg-clip-text text-transparent"
                }
              >
                {t("auth.promo.titleHighlight")}
              </span>
            </h2>
            <p
              className={cn(
                "mt-3 w-full text-[15px] font-medium leading-snug lg:text-base lg:leading-6",
                isBrandPanel ? "text-white/85" : "text-slate-700"
              )}
            >
              {t("auth.promo.subtitle")}
            </p>

            <ul className="mt-6 space-y-2.5">

              {PRO_BENEFITS.map(({ icon: Icon, titleKey, descKey, accent }) => (

                <li

                  key={titleKey}

                  className={cn(

                    "flex items-start gap-3.5 rounded-xl border p-3.5 shadow-sm",

                    isBrandPanel

                      ? "border-white/15 bg-white/10"

                      : "border-pd-border/70 bg-pd-surface"

                  )}

                >

                  <span

                    className={cn(

                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",

                      accent

                    )}

                  >

                    <Icon className="h-4 w-4" aria-hidden />

                  </span>

                  <div className="min-w-0 pt-0.5">

                    <p

                      className={cn(

                        "text-sm font-bold",

                        isBrandPanel ? "text-white" : "text-pd-foreground"

                      )}

                    >

                      {t(titleKey)}

                    </p>

                    <p

                      className={cn(

                        "mt-0.5 text-xs leading-relaxed",

                        isBrandPanel ? "text-white/75" : "text-pd-muted"

                      )}

                    >

                      {t(descKey)}

                    </p>

                  </div>

                </li>

              ))}

            </ul>



            <Link href="/pricing" className="mt-6 block w-full">
              <Button
                size="lg"
                variant={isBrandPanel ? "secondary" : "gradient"}
                className={cn(
                  "w-full font-bold shadow-md",
                  isBrandPanel && "bg-white text-pd-brand hover:bg-white/95"
                )}
              >

                <Crown className="h-4 w-4" />

                {t("auth.promo.cta")}

                <ArrowRight className="h-4 w-4" />

              </Button>

            </Link>



            <p
              className={cn(
                "mt-4 flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium",
                isBrandPanel ? "text-white/75" : "text-slate-600"
              )}
            >

              <ShieldCheck

                className={cn(

                  "h-3.5 w-3.5 shrink-0",

                  isBrandPanel ? "text-white/90" : "text-pd-brand"

                )}

              />

              {t("auth.promo.trust")}

            </p>

          </div>

        </div>



        <div className="pd-auth-shell-form flex items-center justify-center px-4 py-10 sm:px-6 lg:py-12">

          <div className="w-full max-w-md">

            {(title || subtitle) ? (

              <div className="mb-6 text-center lg:hidden">

                {title && <h1 className="text-2xl font-bold text-pd-foreground">{title}</h1>}

                {subtitle && <p className="mt-2 text-sm text-pd-muted">{subtitle}</p>}

              </div>

            ) : null}



            <div className="rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-lg sm:p-8">

              {children}

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}

