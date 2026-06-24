import type { Metadata } from "next";
import { AllToolsPageContent } from "@/components/marketing/all-tools-page-content";
import { PageAeoSummary } from "@/components/seo/page-aeo-summary";
import { JsonLd } from "@/lib/seo/json-ld";
import { allToolsItemListJsonLd } from "@/lib/seo/marketing-aeo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "All PDF Tools — Merge, Split, Convert & More",
  description:
    "Browse every PDF tool on OnlyMyPDF — merge, split, compress, convert, edit, sign, protect, unlock, scan, and AI summarization.",
  path: "/all-tools",
  keywords: ["all PDF tools", "PDF toolkit", "online PDF utilities"],
});

export const revalidate = 3600;

export default function AllToolsPage() {
  return (
    <>
      <JsonLd data={allToolsItemListJsonLd()} />
      <PageAeoSummary variant="all-tools" />
      <AllToolsPageContent />
    </>
  );
}
