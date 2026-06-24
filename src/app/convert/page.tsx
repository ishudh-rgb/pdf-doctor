import type { Metadata } from "next";
import { ConvertPageContent } from "@/components/marketing/convert-page-content";
import { PageAeoSummary } from "@/components/seo/page-aeo-summary";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Convert PDF — PDF to Word, Excel, PowerPoint & More",
  description:
    "Convert files to and from PDF format. PDF to Word, Excel, PowerPoint, Word/Excel/PPT to PDF — free, fast, and secure.",
  path: "/convert",
  keywords: ["convert PDF", "PDF to Word", "Word to PDF", "PDF converter"],
});

export const revalidate = 3600;

export default function ConvertPage() {
  return (
    <>
      <PageAeoSummary variant="convert" />
      <ConvertPageContent />
    </>
  );
}
