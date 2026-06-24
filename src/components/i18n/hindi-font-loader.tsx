"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/i18n";

let devanagariLoaded = false;

export function HindiFontLoader() {
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    if (language !== "hi" || devanagariLoaded) return;

    void import("@/lib/fonts/devanagari").then(({ notoSansDevanagari }) => {
      document.documentElement.classList.add(notoSansDevanagari.variable);
      devanagariLoaded = true;
    });
  }, [language]);

  return null;
}
