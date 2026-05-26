"use client";

import { Table } from "lucide-react";
import { ConvertToolPage } from "@/components/tools/convert-tool-page";

export default function PdfToExcelPage() {
  return (
    <ConvertToolPage
      title="PDF to Excel"
      description="Convert PDF tables and text into an editable Excel spreadsheet"
      icon={<Table className="w-8 h-8" style={{ color: "#217346" }} />}
      accentColor="#217346"
      accept=".pdf,application/pdf"
      uploadHint="Select a PDF file to convert to Excel (.xlsx)"
      processLabel="Convert to Excel"
      processingLabel="Converting to Excel..."
      successTitle="Excel file ready!"
      successDescription="Your spreadsheet has been generated from the PDF content."
      downloadLabel="Download XLSX"
      outputExtension="xlsx"
      apiPath="/api/tools/pdf-to-excel"
      relatedTools={[
        { name: "Excel to PDF", href: "/excel-to-pdf", color: "#217346" },
        { name: "PDF to Word", href: "/pdf-to-word", color: "#1565C0" },
        { name: "PDF to PPT", href: "/pdf-to-ppt", color: "#D24726" },
      ]}
    />
  );
}
