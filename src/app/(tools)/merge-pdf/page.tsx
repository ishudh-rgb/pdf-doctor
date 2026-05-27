'use client';

import { useState, useRef, useCallback } from 'react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
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
  { name: 'Split PDF', href: '/split-pdf' },
  { name: 'Compress PDF', href: '/compress-pdf' },
  { name: 'PDF to Word', href: '/pdf-to-word' },
  { name: 'JPG to PDF', href: '/jpg-to-pdf' },
];

const FAQS = [
  { q: 'Is there a limit to how many PDFs I can merge?', a: 'You can merge up to 20 PDF files at once. Each file can be up to 50MB in size.' },
  { q: 'Will the merged PDF keep the original formatting?', a: 'Yes, merging preserves all formatting, images, links, and bookmarks from the original documents.' },
  { q: 'Can I reorder the files before merging?', a: 'Absolutely! Use the up and down arrows to arrange your files in the desired order before merging.' },
  { q: 'Is my data secure?', a: 'All uploaded files are processed securely and automatically deleted from our servers after processing.' },
];

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const pdfFiles = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    setFiles(prev => [...prev, ...pdfFiles]);
    setError(null);
    setCompleted(false);
    setResultUrl(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const handleProcess = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('options', JSON.stringify({}));

      const res = await fetch('/api/tools/merge-pdf', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to merge PDFs. Please try again.');

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename('merged.pdf');
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Merge PDF"
      description="Combine multiple PDF files into a single document"
      relatedTools={mapRelatedTools(RELATED_TOOLS)}
      faqs={mapFaqs(FAQS)}
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="PDFs Merged Successfully!"
          description="Your merged document is ready to download."
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || 'merged.pdf'}
          downloadLabel="Download Merged PDF"
          resetLabel="Merge more files"
          onReset={() => {
            setCompleted(false);
            setFiles([]);
            setResultUrl(null);
          }}
        />
      ) : (
        <>
          <ToolDropzone
            hint="Drop PDF files here or click to browse"
            subHint="Select multiple PDF files to merge"
            dragOver={dragOver}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="group flex items-center gap-3 rounded-lg bg-pd-background p-3">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveFile(index, 'up')} disabled={index === 0} className="rounded p-0.5 hover:bg-pd-border disabled:opacity-30">
                      <ArrowUp className="h-3.5 w-3.5 text-pd-muted" />
                    </button>
                    <button type="button" onClick={() => moveFile(index, 'down')} disabled={index === files.length - 1} className="rounded p-0.5 hover:bg-pd-border disabled:opacity-30">
                      <ArrowDown className="h-3.5 w-3.5 text-pd-muted" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-pd-foreground">{file.name}</p>
                    <p className="text-xs text-pd-muted">{formatFileSize(file.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeFile(index)} className="rounded-lg p-1.5 text-pd-muted hover:bg-red-50 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={files.length < 2}
            loading={processing}
            loadingLabel="Merging your PDFs..."
          >
            {`Merge ${files.length} PDF${files.length !== 1 ? 's' : ''}`}
          </ToolPrimaryButton>
        </>
      )}
    </ToolPageShell>
  );
}
