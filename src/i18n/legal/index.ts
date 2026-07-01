import type { Language } from "@/types";

export type LegalBlock = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  pageTitle: string;
  lastUpdated: string;
  sections: LegalBlock[];
};

export type LegalDocId = "terms" | "privacy" | "cookies";

import { termsLegal } from "./terms-content";
import { privacyLegal } from "./privacy-content";
import { cookiesLegal } from "./cookies-content";

const DOCS: Record<LegalDocId, Record<Language, LegalDocument>> = {
  terms: termsLegal,
  privacy: privacyLegal,
  cookies: cookiesLegal,
};

export function getLegalDocument(doc: LegalDocId, language: Language): LegalDocument {
  const bundle = DOCS[doc];
  return bundle[language] ?? bundle.en;
}
