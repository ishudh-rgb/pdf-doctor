"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/i18n";

export function LangSync() {
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.lang = language;
  }, [language]);

  return null;
}
