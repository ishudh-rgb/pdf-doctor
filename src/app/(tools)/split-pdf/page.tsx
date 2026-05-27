'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { mapFaqs, mapRelatedTools } from '@/components/tools/tool-helpers';
import { SplitRangePreview } from '@/components/tools/previews/split-preview';
import { getPdfPageCount } from '@/lib/utils/pdf-page-count';
import {
  ToolDropzone,
  ToolErrorBanner,
  ToolPrimaryButton,
  ToolSuccessPanel,
} from '@/components/tools/tool-ui';

const RELATED_TOOLS = [
  { name: 'Merge PDF', href: '/merge-pdf' },
  { name: 'Compress PDF', href: '/compress-pdf' },
  { name: 'PDF to Word', href: '/pdf-to-word' },
  { name: 'Word to PDF', href: '/word-to-pdf' },
];

const FAQS = [
  { q: 'Can I extract specific pages from a PDF?', a: 'Yes! Use the "Split by range" option to specify the exact start and end pages you want to extract.' },
  { q: 'What happens when I split all pages?', a: 'Each page of your PDF will be saved as a separate PDF file, bundled together in a ZIP download.' },
  { q: 'Is the original PDF quality preserved?', a: 'Absolutely. Splitting does not alter the content or quality of your PDF pages in any way.' },
  { q: 'Can I split a password-protected PDF?', a: 'Currently, you need to remove password protection before splitting. We plan to add this feature soon.' },
];

type SplitMode = 'all' | 'range';

export default function SplitPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('all');
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('');
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!files[0]) {
      setTotalPages(null);
      return;
    }

    getPdfPageCount(files[0])
      .then(setTotalPages)
      .catch(() => setTotalPages(null));
  }, [files]);

  useEffect(() => {
    if (totalPages && !endPage) {
      setEndPage(String(totalPages));
    }
  }, [totalPages, endPage]);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const pdfFiles = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      setFiles([pdfFiles[0]]);
      setError(null);
      setCompleted(false);
      setResultUrl(null);
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

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('mode', splitMode);
      if (splitMode === 'range') {
        formData.append('ranges', `${parseInt(startPage)}-${parseInt(endPage)}`);
      }

      const res = await fetch('/api/tools/split-pdf', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to split PDF. Please try again.');

      const contentType = res.headers.get('content-type') || '';
      const isZip = contentType.includes('application/zip');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(isZip ? 'split-pages.zip' : 'split.pdf');
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Split PDF"
      description="Split a PDF into separate pages or custom ranges"
      relatedTools={mapRelatedTools(RELATED_TOOLS)}
      faqs={mapFaqs(FAQS)}
      preview={
        files.length > 0 && !completed ? (
          <SplitRangePreview
            splitMode={splitMode}
            startPage={startPage}
            endPage={endPage}
            totalPages={totalPages}
          />
        ) : undefined
      }
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="PDF Split Successfully!"
          description={
            resultFilename?.endsWith('.zip')
              ? 'Each page is saved as a separate PDF inside a ZIP file.'
              : 'Your split document is ready to download.'
          }
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || 'split.pdf'}
          downloadLabel={resultFilename?.endsWith('.zip') ? 'Download ZIP File' : 'Download Split PDF'}
          resetLabel="Split another file"
          onReset={() => {
            setCompleted(false);
            setFiles([]);
            setResultUrl(null);
          }}
        />
      ) : (
        <>
          <ToolDropzone
            hint="Drop a PDF file here or click to browse"
            subHint="Select a PDF file to split"
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
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {files.length > 0 && (
            <>
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-pd-brand-muted p-3">
                <Scissors className="h-4 w-4 shrink-0 text-pd-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-pd-foreground">{files[0].name}</p>
                  <p className="text-xs text-pd-muted">{formatFileSize(files[0].size)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-pd-foreground">Split Options</h3>
                <label className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all',
                  splitMode === 'all' ? 'border-pd-brand bg-pd-brand-muted' : 'border-pd-border hover:border-pd-muted'
                )}>
                  <input type="radio" name="splitMode" checked={splitMode === 'all'} onChange={() => setSplitMode('all')} className="accent-pd-brand" />
                  <div>
                    <p className="text-sm font-medium text-pd-foreground">Split all pages</p>
                    <p className="text-xs text-pd-muted">Each page becomes a separate PDF</p>
                  </div>
                </label>
                <label className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
                  splitMode === 'range' ? 'border-pd-brand bg-pd-brand-muted' : 'border-pd-border hover:border-pd-muted'
                )}>
                  <input type="radio" name="splitMode" checked={splitMode === 'range'} onChange={() => setSplitMode('range')} className="mt-0.5 accent-pd-brand" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-pd-foreground">Split by range</p>
                    <p className="mb-2 text-xs text-pd-muted">Extract specific pages</p>
                    {splitMode === 'range' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={startPage}
                          onChange={(e) => setStartPage(e.target.value)}
                          placeholder="Start"
                          className="w-20 rounded-lg border border-pd-border px-2.5 py-1.5 text-sm focus:border-pd-brand focus:outline-none"
                        />
                        <span className="text-sm text-pd-muted">to</span>
                        <input
                          type="number"
                          min="1"
                          value={endPage}
                          onChange={(e) => setEndPage(e.target.value)}
                          placeholder="End"
                          className="w-20 rounded-lg border border-pd-border px-2.5 py-1.5 text-sm focus:border-pd-brand focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </>
          )}

          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={files.length === 0}
            loading={processing}
            loadingLabel="Splitting your PDF..."
          >
            Split PDF
          </ToolPrimaryButton>
        </>
      )}
    </ToolPageShell>
  );
}
