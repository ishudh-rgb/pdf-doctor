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

export type LegalDocId = "terms" | "privacy" | "cookies" | "refund" | "trust" | "sla";

import { termsLegal } from "./terms-content";
import { privacyLegal } from "./privacy-content";
import { cookiesLegal } from "./cookies-content";
import { refundLegal, trustLegal, slaLegal } from "./refund-trust-sla-content";

const DOCS: Record<LegalDocId, Record<Language, LegalDocument>> = {
  terms: termsLegal,
  privacy: privacyLegal,
  cookies: cookiesLegal,
  refund: refundLegal,
  trust: trustLegal,
  sla: slaLegal,
};

export function getLegalDocument(doc: LegalDocId, language: Language): LegalDocument {
  const bundle = DOCS[doc];
  return bundle[language] ?? bundle.en;
}
