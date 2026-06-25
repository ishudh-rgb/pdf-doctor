import type { Metadata } from "next";
import { getAllFaqItems } from "@/config/faq-data";
import { FaqPageContent } from "@/components/marketing/faq-page-content";
import { PageAeoSummary } from "@/components/seo/page-aeo-summary";
import { JsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ — PDF Tools Help & Answers",
  description:
    "Answers to common questions about OnlyMyPDF — pricing, security, file limits, supported formats, and how to use our PDF tools.",
  path: "/faq",
  keywords: ["PDF tools FAQ", "OnlyMyPDF help", "PDF security questions"],
});

export const revalidate = 3600;

export default function FaqPage() {
  const faqs = getAllFaqItems();
  const faqSchema = faqPageJsonLd(faqs);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <FaqPageContent />
      <PageAeoSummary variant="faq" />
    </>
  );
}
