import type { Metadata } from "next";
import { AllToolsPageContent } from "@/components/marketing/all-tools-page-content";

export const metadata: Metadata = {
  title: "All PDF Tools - PDF Doctor",
  description:
    "Browse every PDF tool available on PDF Doctor — merge, split, compress, convert, edit, sign, protect, unlock, scan, and AI-powered summarization.",
};

export default function AllToolsPage() {
  return <AllToolsPageContent />;
}
