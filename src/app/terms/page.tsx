import type { Metadata } from "next";
import { LocalizedLegalDocument } from "@/components/marketing/legal/localized-legal-document";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Read the Terms of Service for OnlyMyPDF. Understand your rights and responsibilities when using our PDF tools.",
  path: "/terms",
});

export default function TermsPage() {
  return <LocalizedLegalDocument doc="terms" />;
}
