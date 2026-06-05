"use client";

import { ConvertToolPage } from "@/components/tools/convert-tool-page";

export default function PdfToPptPage() {
  return (
    <ConvertToolPage
      title="PDF to PowerPoint"
      description="Convert PDF pages into aligned PowerPoint slides with tables and embedded images"
      accept=".pdf,application/pdf"
      uploadHint="Select a PDF file — tables, text, and images will be converted to .pptx slides"
      processLabel="Convert to PowerPoint"
      processingLabel="Converting to PowerPoint..."
      successTitle="PowerPoint file ready!"
      successDescription="Your presentation includes aligned tables, page content, and any embedded images from the PDF."
      downloadLabel="Download PPTX"
      outputExtension="pptx"
      apiPath="/api/tools/pdf-to-ppt"
      showOutputSize
      relatedTools={[
        { name: "PowerPoint to PDF", href: "/ppt-to-pdf" },
        { name: "PDF to Word", href: "/pdf-to-word" },
        { name: "PDF to Excel", href: "/pdf-to-excel" },
      ]}
    />
  );
}
