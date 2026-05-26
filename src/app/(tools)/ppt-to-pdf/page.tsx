"use client";

import { Presentation } from "lucide-react";
import { ConvertToolPage } from "@/components/tools/convert-tool-page";

export default function PptToPdfPage() {
  return (
    <ConvertToolPage
      title="PowerPoint to PDF"
      description="Convert PowerPoint to professional landscape PDF with tables, images, and slide layout preserved"
      icon={<Presentation className="w-8 h-8" style={{ color: "#D24726" }} />}
      accentColor="#D24726"
      accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
      uploadHint="Select a .pptx file — each slide exports as a polished 16:9 PDF page"
      processLabel="Convert to PDF"
      processingLabel="Converting to PDF..."
      successTitle="PDF ready!"
      successDescription="Your presentation has been converted to a professional landscape PDF with tables and images."
      downloadLabel="Download PDF"
      outputExtension="pdf"
      apiPath="/api/tools/ppt-to-pdf"
      relatedTools={[
        { name: "PDF to PowerPoint", href: "/pdf-to-ppt", color: "#D24726" },
        { name: "Word to PDF", href: "/word-to-pdf", color: "#C62828" },
        { name: "JPG to PDF", href: "/jpg-to-pdf", color: "#7B1FA2" },
      ]}
    />
  );
}
