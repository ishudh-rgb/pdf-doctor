"use client";

import { ToolPageShell } from "@/components/layout/tool-page-shell";
import { PdfScannerWorkspace } from "@/components/tools/lazy-workspaces";
import { mapFaqs, mapRelatedTools } from "@/components/tools/tool-helpers";

const RELATED_TOOLS = [
  { name: "JPG to PDF", href: "/jpg-to-pdf" },
  { name: "Compress PDF", href: "/compress-pdf" },
  { name: "Merge PDF", href: "/merge-pdf" },
  { name: "PDF to Word", href: "/pdf-to-word" },
];

const FAQS = [
  {
    q: "Can I scan multiple pages into one PDF?",
    a: "Yes. Capture or upload as many images as you need. Each image becomes a page in the final PDF, in the order shown in the page strip.",
  },
  {
    q: "Which filter should I use?",
    a: "Enhanced works well for most documents. Black & White is ideal for text-heavy pages and receipts. Original keeps photo colors unchanged.",
  },
  {
    q: "Does the camera work on desktop?",
    a: "Yes, if your device has a webcam. For best results scanning physical documents, use a phone or tablet with the rear camera.",
  },
  {
    q: "Is my data secure?",
    a: "All uploads are encrypted in transit. Files are automatically deleted from our servers within 2 hours of processing.",
  },
];

export default function PDFScannerPage() {
  return (
    <ToolPageShell
      title="PDF Scanner"
      description="Scan documents to PDF using your camera or upload images. Multi-page support with professional scan filters."
      fullWidthWorkspace
      relatedTools={mapRelatedTools(RELATED_TOOLS)}
      faqs={mapFaqs(FAQS)}
    >
      <PdfScannerWorkspace />
    </ToolPageShell>
  );
}
