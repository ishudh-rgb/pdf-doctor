"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguageStore } from "@/i18n";
import { localeFromPathname, LOCALE_COOKIE } from "@/lib/i18n/locale-path";

function readLocaleCookie(): "en" | "hi" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return value === "hi" || value === "en" ? value : null;
}

export function LangSync() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const pathname = usePathname();

  useEffect(() => {
    const fromPath = localeFromPathname(pathname);
    const fromCookie = readLocaleCookie();
    const resolved = fromPath === "hi" ? "hi" : fromCookie ?? language;
    if (resolved !== language) {
      setLanguage(resolved);
    }
  }, [pathname, language, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.lang = language;
  }, [language]);

  return null;
}
