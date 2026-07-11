"use client";

import { useCallback } from "react";
import { useTranslation } from "@/i18n";
import { withLocalePrefix } from "@/lib/i18n/locale-path";

/** Prefix internal paths with `/hi` when the active UI language is Hindi. */
export function useLocaleHref() {
  const { language } = useTranslation();
  return useCallback((path: string) => withLocalePrefix(path, language), [language]);
}
