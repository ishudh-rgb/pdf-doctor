"use client";

import { ConvertToolPage } from "@/components/tools/convert-tool-page";

export default function PptToPdfPage() {
  return (
    <ConvertToolPage
      title="PowerPoint to PDF"
      description="Convert PowerPoint to professional landscape PDF with tables, images, and slide layout preserved"
      accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
      uploadHint="Select a .ppt or .pptx file — each slide exports as a polished 16:9 PDF page"
      processLabel="Convert to PDF"
      processingLabel="Converting to PDF..."
      successTitle="PDF ready!"
      successDescription="Your presentation has been converted to a professional landscape PDF with tables and images."
      downloadLabel="Download PDF"
      outputExtension="pdf"
      apiPath="/api/tools/ppt-to-pdf"
      relatedTools={[
        { name: "PDF to PowerPoint", href: "/pdf-to-ppt" },
        { name: "Word to PDF", href: "/word-to-pdf" },
        { name: "JPG to PDF", href: "/jpg-to-pdf" },
        { name: "Compress PDF", href: "/compress-pdf" },
      ]}
    />
  );
}
