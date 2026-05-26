"use client";

import { Presentation } from "lucide-react";
import { ConvertToolPage } from "@/components/tools/convert-tool-page";

export default function PdfToPptPage() {
  return (
    <ConvertToolPage
      title="PDF to PowerPoint"
      description="Convert PDF pages into aligned PowerPoint slides with tables and embedded images"
      icon={<Presentation className="w-8 h-8" style={{ color: "#D24726" }} />}
      accentColor="#D24726"
      accept=".pdf,application/pdf"
      uploadHint="Select a PDF file — tables, text, and images will be converted to .pptx slides"
      processLabel="Convert to PowerPoint"
      processingLabel="Converting to PowerPoint..."
      successTitle="PowerPoint file ready!"
      successDescription="Your presentation includes aligned tables, page content, and any embedded images from the PDF."
      downloadLabel="Download PPTX"
      outputExtension="pptx"
      apiPath="/api/tools/pdf-to-ppt"
      relatedTools={[
        { name: "PowerPoint to PDF", href: "/ppt-to-pdf", color: "#D24726" },
        { name: "PDF to Word", href: "/pdf-to-word", color: "#1565C0" },
        { name: "PDF to Excel", href: "/pdf-to-excel", color: "#217346" },
      ]}
    />
  );
}
