import type { Metadata } from "next";
import { LocalizedLegalDocument } from "@/components/marketing/legal/localized-legal-document";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Service Level & Status",
  description:
    "OnlyMyPDF uptime targets, maintenance windows, and service level information.",
  path: "/sla",
});

export default function SlaPage() {
  return <LocalizedLegalDocument doc="sla" />;
}
