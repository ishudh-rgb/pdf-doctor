import type { Metadata } from "next";
import { AboutPageContent } from "@/components/marketing/about-page-content";
import { PageAeoSummary } from "@/components/seo/page-aeo-summary";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About OnlyMyPDF — Free Online PDF Toolkit",
  description:
    "Learn about OnlyMyPDF — the free, secure online PDF toolkit. Our mission is to make professional PDF tools accessible to everyone.",
  path: "/about",
});

export const revalidate = 3600;

export default function AboutPage() {
  return (
    <>
      <AboutPageContent />
      <PageAeoSummary variant="about" />
    </>
  );
}
