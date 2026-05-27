'use client';

import { useState, useRef, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { mapFaqs, mapRelatedTools } from '@/components/tools/tool-helpers';
import {
  ToolDropzone,
  ToolErrorBanner,
  ToolPrimaryButton,
  ToolSuccessPanel,
} from '@/components/tools/tool-ui';

const RELATED_TOOLS = [
  { name: 'PDF to Word', href: '/pdf-to-word' },
  { name: 'Merge PDF', href: '/merge-pdf' },
  { name: 'Compress PDF', href: '/compress-pdf' },
  { name: 'JPG to PDF', href: '/jpg-to-pdf' },
];

const FAQS = [
  { q: 'What Word formats are supported?', a: 'We support both .doc and .docx formats. For best results, use the newer .docx format.' },
  { q: 'Will the formatting be preserved?', a: 'Yes, most formatting including fonts, images, tables, and styles are preserved during conversion.' },
  { q: 'Is there a file size limit?', a: 'You can convert Word documents up to 50MB in size.' },
  { q: 'Can I convert multiple files at once?', a: 'Currently, conversion works one file at a time. You can use our Merge tool to combine the resulting PDFs.' },
];

export default function WordToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const accepted = Array.from(newFiles).filter(
      f => f.name.endsWith('.doc') || f.name.endsWith('.docx') ||
        f.type === 'application/msword' ||
        f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    if (accepted.length > 0) {
      setFiles([accepted[0]]);
      setError(null);
      setCompleted(false);
      setResultUrl(null);
      setProgress(0);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    setProgress(20);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      setProgress(50);
      const res = await fetch('/api/tools/word-to-pdf', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to convert Word to PDF. Please try again.');
      }

      setProgress(80);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(files[0].name.replace(/\.docx?$/, '.pdf'));
      setProgress(100);
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Word to PDF"
      description="Convert Word documents to PDF format"
      relatedTools={mapRelatedTools(RELATED_TOOLS)}
      faqs={mapFaqs(FAQS)}
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="Conversion Complete!"
          description="Your PDF is ready to download."
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || 'converted.pdf'}
          downloadLabel="Download PDF"
          resetLabel="Convert another file"
          onReset={() => {
            setCompleted(false);
            setFiles([]);
            setResultUrl(null);
            setProgress(0);
          }}
        />
      ) : (
        <>
          <ToolDropzone
            hint="Drop a Word document here or click to browse"
            subHint="Supports .doc and .docx files"
            dragOver={dragOver}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {files.length > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-pd-brand-muted p-3">
              <FileText className="h-4 w-4 shrink-0 text-pd-brand" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-pd-foreground">{files[0].name}</p>
                <p className="text-xs text-pd-muted">{formatFileSize(files[0].size)}</p>
              </div>
            </div>
          )}

          {processing && (
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-pd-border">
                <div
                  className="h-2 rounded-full bg-pd-brand transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-pd-muted">{progress}% complete</p>
            </div>
          )}

          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={files.length === 0}
            loading={processing}
            loadingLabel="Converting to PDF..."
          >
            Convert to PDF
          </ToolPrimaryButton>
        </>
      )}
    </ToolPageShell>
  );
}
