"use client";

import { ConvertToolPage } from "@/components/tools/convert-tool-page";

export default function PdfToExcelPage() {
  return (
    <ConvertToolPage
      title="PDF to Excel"
      description="Convert PDF tables and text into an editable Excel spreadsheet"
      accept=".pdf,application/pdf"
      uploadHint="Select a PDF file to convert to Excel (.xlsx)"
      processLabel="Convert to Excel"
      processingLabel="Converting to Excel..."
      successTitle="Excel file ready!"
      successDescription="Your spreadsheet has been generated from the PDF content."
      downloadLabel="Download XLSX"
      outputExtension="xlsx"
      apiPath="/api/tools/pdf-to-excel"
      showOutputSize
      relatedTools={[
        { name: "Excel to PDF", href: "/excel-to-pdf" },
        { name: "PDF to Word", href: "/pdf-to-word" },
        { name: "PDF to PPT", href: "/pdf-to-ppt" },
      ]}
    />
  );
}
