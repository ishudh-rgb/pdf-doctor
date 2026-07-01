"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useLanguageStore } from "@/i18n";
import {
  LOCALE_COOKIE,
  localeFromPathname,
  withLocalePrefix,
} from "@/lib/i18n/locale-path";

interface LanguageSwitchProps {
  className?: string;
}

function readLocaleCookie(): "en" | "hi" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return value === "hi" || value === "en" ? value : null;
}

export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    const fromPath = localeFromPathname(pathname);
    const fromCookie = readLocaleCookie();

    const resolved =
      langParam === "en" || langParam === "hi"
        ? langParam
        : fromPath === "hi"
          ? "hi"
          : fromCookie ?? "en";

    if (resolved !== language) {
      setLanguage(resolved);
    }
  }, [pathname, setLanguage, language]);

  const switchLocale = (locale: "en" | "hi") => {
    setLanguage(locale);
    const target = withLocalePrefix(pathname, locale);
    const params = new URLSearchParams(window.location.search);
    params.delete("lang");
    const query = params.toString();
    router.push(query ? `${target}?${query}` : target);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-semibold backdrop-blur-sm",
        className
      )}
      role="group"
      aria-label="Language switcher"
    >
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={cn(
          "rounded-md px-2.5 py-1 transition-colors cursor-pointer",
          language === "en"
            ? "bg-white text-indigo-700 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale("hi")}
        className={cn(
          "rounded-md px-2.5 py-1 transition-colors cursor-pointer font-[family-name:var(--font-devanagari)]",
          language === "hi"
            ? "bg-white text-indigo-700 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        HI
      </button>
    </div>
  );
}
