"use client";

import type { ReactNode } from "react";
import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { getLegalDocument, type LegalDocId } from "@/i18n/legal";
import { useTranslation } from "@/i18n";

export function LocalizedLegalDocument({
  doc,
  prepend,
}: {
  doc: LegalDocId;
  prepend?: ReactNode;
}) {
  const { language } = useTranslation();
  const content = getLegalDocument(doc, language);

  return (
    <LegalPageContent title={content.pageTitle} lastUpdated={content.lastUpdated}>
      {prepend}
      <div className="space-y-10">
        {content.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed">
              {section.paragraphs?.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
              {section.bullets?.length ? (
                <ul className="list-disc space-y-2 pl-5">
                  {section.bullets.map((item) => (
                    <li key={item.slice(0, 40)}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </LegalPageContent>
  );
}
