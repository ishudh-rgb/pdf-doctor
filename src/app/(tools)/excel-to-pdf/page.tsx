"use client";

import { FileSpreadsheet } from "lucide-react";
import { ConvertToolPage } from "@/components/tools/convert-tool-page";

export default function ExcelToPdfPage() {
  return (
    <ConvertToolPage
      title="Excel to PDF"
      description="Convert Excel spreadsheets to PDF documents"
      icon={<FileSpreadsheet className="w-8 h-8" style={{ color: "#217346" }} />}
      accentColor="#217346"
      accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      uploadHint="Select an Excel file (.xls or .xlsx)"
      processLabel="Convert to PDF"
      processingLabel="Converting to PDF..."
      successTitle="PDF ready!"
      successDescription="Your Excel workbook has been converted to PDF."
      downloadLabel="Download PDF"
      outputExtension="pdf"
      apiPath="/api/tools/excel-to-pdf"
      relatedTools={[
        { name: "PDF to Excel", href: "/pdf-to-excel", color: "#217346" },
        { name: "Word to PDF", href: "/word-to-pdf", color: "#C62828" },
        { name: "Compress PDF", href: "/compress-pdf", color: "#FF9800" },
      ]}
    />
  );
}
