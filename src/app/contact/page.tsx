import type { Metadata } from "next";
import { ContactPageContent } from "@/components/marketing/contact-page-content";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Us — Get Help with PDF Tools",
  description:
    "Contact the OnlyMyPDF team for support, billing questions, or feedback about our free online PDF tools.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactPageContent />;
}
