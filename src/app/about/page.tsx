import type { Metadata } from "next";
import { AboutPageContent } from "@/components/marketing/about-page-content";

export const metadata: Metadata = {
  title: "About PDF Doctor",
  description:
    "Learn about PDF Doctor — the free, secure online PDF toolkit trusted by thousands. Our mission is to make PDF tools accessible to everyone.",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
