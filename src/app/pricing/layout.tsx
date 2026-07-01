import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PageAeoSummary } from "@/components/seo/page-aeo-summary";
import { JsonLd, pricingProProductJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing — Free & Pro PDF Tools Plans (India)",
  description:
    "Compare OnlyMyPDF Free vs Pro: merge, convert, compress, AI PDF summarizer & e-sign. Start free — upgrade for 100 daily uses, priority speed & 24h file retention.",
  path: "/pricing",
  keywords: [
    "PDF tools pricing India",
    "OnlyMyPDF Pro plan",
    "free PDF tools online",
    "PDF to Word pricing",
    "AI PDF summarizer plan",
  ],
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={pricingProProductJsonLd()} />
      {children}
      <PageAeoSummary variant="pricing" />
    </>
  );
}
