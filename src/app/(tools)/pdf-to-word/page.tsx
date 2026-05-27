'use client';

import { Info } from 'lucide-react';
import { ConvertToolPage } from '@/components/tools/convert-tool-page';

export default function PdfToWordPage() {
  return (
    <ConvertToolPage
      title="PDF to Word"
      description="Convert PDF documents to editable Word format"
      accept=".pdf,application/pdf"
      uploadHint="Select a PDF file to convert to Word"
      processLabel="Convert to Word"
      processingLabel="Converting to Word..."
      successTitle="Converted Successfully!"
      successDescription="Your Word document is ready to download."
      downloadLabel="Download DOCX"
      outputExtension="docx"
      apiPath="/api/tools/pdf-to-word"
      buildFormData={(file, formData) => {
        formData.append('options', JSON.stringify({}));
        return formData;
      }}
      relatedTools={[
        { name: 'Word to PDF', href: '/word-to-pdf' },
        { name: 'Merge PDF', href: '/merge-pdf' },
        { name: 'Compress PDF', href: '/compress-pdf' },
        { name: 'Split PDF', href: '/split-pdf' },
      ]}
      extraFields={
        <div className="flex items-start gap-2 rounded-lg bg-pd-brand-muted/50 p-3 text-sm text-pd-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-pd-brand" />
          <p>For scanned PDFs, OCR will be used to extract text.</p>
        </div>
      }
    />
  );
}
