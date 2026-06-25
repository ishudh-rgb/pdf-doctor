import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PageAeoSummary } from "@/components/seo/page-aeo-summary";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing — Free & Pro PDF Tools Plans",
  description:
    "Compare OnlyMyPDF Free and Pro plans. Get more daily uses, AI tools, priority processing, and no ads with Pro.",
  path: "/pricing",
  keywords: ["PDF tools pricing", "Pro PDF plan", "OnlyMyPDF pricing"],
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageAeoSummary variant="pricing" />
    </>
  );
}
