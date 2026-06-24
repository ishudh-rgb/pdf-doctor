import type { Metadata } from "next";
import { AboutPageContent } from "@/components/marketing/about-page-content";

export const metadata: Metadata = {
  title: "About Only4PDF",
  description:
    "Learn about Only4PDF — the free, secure online PDF toolkit trusted by thousands. Our mission is to make PDF tools accessible to everyone.",
};

export const revalidate = 3600;

export default function AboutPage() {
  return <AboutPageContent />;
}
