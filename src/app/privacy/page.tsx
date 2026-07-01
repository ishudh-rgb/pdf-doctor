import type { Metadata } from "next";
import { LocalizedLegalDocument } from "@/components/marketing/legal/localized-legal-document";
import { PrivacyGdprSections } from "@/components/marketing/privacy-gdpr-sections";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how OnlyMyPDF handles your data, files, and personal information. Your privacy is our priority.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LocalizedLegalDocument doc="privacy" prepend={<PrivacyGdprSections />} />
  );
}
