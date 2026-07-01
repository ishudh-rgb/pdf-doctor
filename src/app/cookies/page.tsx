import type { Metadata } from "next";
import { LocalizedLegalDocument } from "@/components/marketing/legal/localized-legal-document";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cookie Policy",
  description:
    "Learn how OnlyMyPDF uses cookies — essential, analytics, and marketing — and how to manage your preferences.",
  path: "/cookies",
});

export default function CookiesPage() {
  return <LocalizedLegalDocument doc="cookies" />;
}
