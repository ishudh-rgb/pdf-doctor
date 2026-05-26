"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "@/types";

import en from "./en.json";

export const AVAILABLE_LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
];

let hiDictionary: Record<string, unknown> | null = null;
let hiLoadPromise: Promise<void> | null = null;

function loadHiDictionary(): Promise<void> {
  if (hiDictionary) return Promise.resolve();
  if (!hiLoadPromise) {
    hiLoadPromise = import("./hi.json").then((mod) => {
      hiDictionary = mod.default as Record<string, unknown>;
    });
  }
  return hiLoadPromise;
}

function getDictionary(language: Language): Record<string, unknown> {
  if (language === "hi" && hiDictionary) return hiDictionary;
  return en as Record<string, unknown>;
}

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => {
        if (language === "hi") {
          void loadHiDictionary();
        }
        set({ language });
        if (typeof document !== "undefined") {
          document.documentElement.lang = language;
          document.documentElement.dataset.lang = language;
        }
      },
    }),
    { name: "pdf-doctor-language" }
  )
);

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : path;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

const LanguageContext = createContext<Language>("en");

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    if (language === "hi") {
      void loadHiDictionary();
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={language}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const language = useContext(LanguageContext);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const [hiReady, setHiReady] = useState(!!hiDictionary);

  useEffect(() => {
    if (language === "hi" && !hiDictionary) {
      void loadHiDictionary().then(() => setHiReady(true));
    }
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = getDictionary(language);
      let value = getNestedValue(dict, key);
      if (value === key && language === "hi" && !hiReady) {
        value = getNestedValue(en, key);
      }
      if (value === key && language !== "en") {
        value = getNestedValue(en, key);
      }
      return interpolate(value, params);
    },
    [language, hiReady]
  );

  return { t, language, setLanguage, availableLanguages: AVAILABLE_LANGUAGES };
}
