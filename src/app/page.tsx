import type { Metadata } from "next";
import { HomePageContent } from "@/components/marketing/home-page-content";

export const metadata: Metadata = {
  title: "PDF Doctor - Free Online PDF Tools",
  description:
    "Free online PDF tools to merge, split, compress, convert, edit, sign, and protect your PDFs. No signup required for basic tools.",
};

export default function HomePage() {
  return <HomePageContent />;
}
