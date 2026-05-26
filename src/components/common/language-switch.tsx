"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useLanguageStore } from "@/i18n";

interface LanguageSwitchProps {
  className?: string;
}

export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    if (langParam === "en" || langParam === "hi") {
      setLanguage(langParam);
    }
  }, [setLanguage]);

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
        onClick={() => setLanguage("en")}
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
        onClick={() => setLanguage("hi")}
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
