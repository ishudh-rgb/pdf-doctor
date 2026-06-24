'use client';

import { useState, useRef, useCallback } from 'react';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { mapFaqs, mapRelatedTools } from '@/components/tools/tool-helpers';
import { MergePdfWorkspace } from '@/components/tools/lazy-workspaces';
import { ToolDropzone, ToolErrorBanner } from '@/components/tools/tool-ui';

const RELATED_TOOLS = [
  { name: 'Split PDF', href: '/split-pdf' },
  { name: 'Compress PDF', href: '/compress-pdf' },
  { name: 'PDF to Word', href: '/pdf-to-word' },
  { name: 'JPG to PDF', href: '/jpg-to-pdf' },
];

const FAQS = [
  { q: 'Is there a limit to how many PDFs I can merge?', a: 'You can merge up to 20 PDF files at once (50 for Pro). There is no file size limit per file.' },
  { q: 'Will the merged PDF keep the original formatting?', a: 'Yes, merging preserves all formatting, images, links, and bookmarks from the original documents.' },
  { q: 'Can I reorder the files before merging?', a: 'Yes! Drag files in the grid or use the + buttons to add documents in the order you want.' },
  { q: 'Is my data secure?', a: 'All uploaded files are processed securely and automatically deleted from our servers after processing.' },
];

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export default function MergePdfPage() {
  const [sessionFiles, setSessionFiles] = useState<File[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const pdfFiles = Array.from(newFiles).filter(isPdfFile);
    if (pdfFiles.length === 0) {
      setUploadError('Please select PDF files only.');
      return;
    }
    setSessionFiles((prev) => (prev ? [...prev, ...pdfFiles] : pdfFiles));
    setUploadError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const showWorkspace = sessionFiles !== null && sessionFiles.length > 0;

  return (
    <ToolPageShell
      title="Merge PDF"
      description="Combine multiple PDF files into a single document — visual file workspace"
      fullWidthWorkspace={showWorkspace}
      relatedTools={mapRelatedTools(RELATED_TOOLS)}
      faqs={mapFaqs(FAQS)}
    >
      {!showWorkspace ? (
        <div className="mx-auto max-w-xl">
          <ToolDropzone
            hint="or drop files here"
            subHint="Select multiple PDF files to merge"
            dragOver={dragOver}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onChooseFiles={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          {uploadError && <ToolErrorBanner message={uploadError} />}
          <p className="mt-4 text-center text-xs text-pd-muted">
            After upload you&apos;ll see a file grid with thumbnails — like Smallpdf Merge.
          </p>
        </div>
      ) : (
        <div className="w-full">
          <MergePdfWorkspace
            initialFiles={sessionFiles}
            onFilesChange={setSessionFiles}
            onReset={() => setSessionFiles(null)}
          />
        </div>
      )}
    </ToolPageShell>
  );
}
