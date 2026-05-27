import type { Metadata } from "next";
import { ConvertPageContent } from "@/components/marketing/convert-page-content";

export const metadata: Metadata = {
  title: "Convert PDF — PDF to Word, Excel, PowerPoint & More | PDF Doctor",
  description:
    "Convert files to and from PDF format. PDF to Word, Excel, PowerPoint, Word/Excel/PPT to PDF — free, fast, and secure.",
};

export default function ConvertPage() {
  return <ConvertPageContent />;
}
