'use client';

import { useState, useRef, useCallback } from 'react';
import { Minimize2, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { mapFaqs, mapRelatedTools } from '@/components/tools/tool-helpers';
import { CompressionLevelPreview } from '@/components/tools/previews/compression-preview';
import { PdfPasswordModal } from '@/components/tools/pdf-password-modal';
import {
  ToolDropzone,
  ToolErrorBanner,
  ToolPrimaryButton,
  ToolSuccessPanel,
} from '@/components/tools/tool-ui';

const RELATED_TOOLS = [
  { name: 'Merge PDF', href: '/merge-pdf' },
  { name: 'Split PDF', href: '/split-pdf' },
  { name: 'PDF to Word', href: '/pdf-to-word' },
  { name: 'JPG to PDF', href: '/jpg-to-pdf' },
];

const FAQS = [
  { q: 'How much can a PDF be compressed?', a: 'Compression results vary depending on the content. Files with images typically see 40-80% reduction, while text-heavy PDFs may see 10-30% reduction.' },
  { q: 'Will compression reduce the quality of my PDF?', a: 'Basic compression preserves quality while reducing size. Strong compression may slightly reduce image quality but keeps text crisp.' },
  { q: 'Is there a file size limit?', a: 'No — compress PDF files of any size.' },
  { q: 'Can I compress multiple files at once?', a: 'Currently, compression works on one file at a time. Use our Merge tool to combine files after compressing them individually.' },
];

type CompressionLevel = 'basic' | 'strong';

export default function CompressPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('basic');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [pdfPassword, setPdfPassword] = useState<string | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<{
    fileName: string;
    errorMsg?: string;
    loading?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const pdfFiles = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      setFiles([pdfFiles[0]]);
      setOriginalSize(pdfFiles[0].size);
      setError(null);
      setCompleted(false);
      setResultUrl(null);
      setPdfPassword(null);
      setPasswordPrompt(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const runCompress = useCallback(async (password?: string | null) => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('level', compressionLevel);
      const pw = password ?? pdfPassword;
      if (pw) formData.append('password', pw);

      const res = await fetch('/api/tools/compress-pdf', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        const msg = data.error ?? 'Failed to compress PDF. Please try again.';
        if (msg.toLowerCase().includes('password')) {
          setPasswordPrompt({
            fileName: files[0].name,
            errorMsg: msg.toLowerCase().includes('incorrect') ? msg : undefined,
            loading: false,
          });
          return;
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename('compressed.pdf');
      const headerOriginal = res.headers.get('X-Original-Size');
      const headerCompressed = res.headers.get('X-Compressed-Size');
      setCompressedSize(headerCompressed ? parseInt(headerCompressed, 10) : blob.size);
      if (headerOriginal) setOriginalSize(parseInt(headerOriginal, 10));
      if (pw) setPdfPassword(pw);
      setPasswordPrompt(null);
      setCompleted(true);
      const { notifyActivityUpdated } = await import("@/lib/client/activity-events");
      notifyActivityUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  }, [files, compressionLevel, pdfPassword]);

  const handleProcess = () => runCompress();

  const compressionPercentage = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

  return (
    <ToolPageShell
      title="Compress PDF"
      description="Reduce your PDF file size without losing quality"
      splitWorkspace={!completed}
      previewPlaceholder="Select a PDF to see estimated compression"
      relatedTools={mapRelatedTools(RELATED_TOOLS)}
      faqs={mapFaqs(FAQS)}
      preview={
        files.length > 0 && !completed ? (
          <CompressionLevelPreview level={compressionLevel} originalSize={originalSize} />
        ) : undefined
      }
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="PDF Compressed Successfully!"
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || 'compressed.pdf'}
          downloadLabel="Download Compressed PDF"
          resultSizeBytes={compressedSize}
          resetLabel="Compress another file"
          onReset={() => {
            setCompleted(false);
            setFiles([]);
            setResultUrl(null);
            setCompressedSize(0);
          }}
        >
          {compressionPercentage === 0 ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              This PDF is already well optimized. No further size reduction was possible without lowering quality.
            </p>
          ) : (
            <div className="mt-4 inline-flex items-center gap-6 rounded-xl bg-pd-background p-4">
              <div className="text-center">
                <p className="mb-1 text-xs text-pd-muted">Before</p>
                <p className="text-sm font-bold text-pd-foreground">{formatFileSize(originalSize)}</p>
              </div>
              <div className="text-2xl text-pd-border">&rarr;</div>
              <div className="text-center">
                <p className="mb-1 text-xs text-pd-muted">After</p>
                <p className="text-sm font-bold text-pd-brand">{formatFileSize(compressedSize)}</p>
              </div>
              <div className="h-10 w-px bg-pd-border" />
              <div className="text-center">
                <p className="mb-1 text-xs text-pd-muted">Saved</p>
                <p className="text-sm font-bold text-green-600">{compressionPercentage}%</p>
              </div>
            </div>
          )}
        </ToolSuccessPanel>
      ) : (
        <>
          {passwordPrompt && (
            <PdfPasswordModal
              fileName={passwordPrompt.fileName}
              errorMessage={passwordPrompt.errorMsg}
              loading={passwordPrompt.loading}
              onSubmit={(pw) => {
                setPasswordPrompt((prev) => prev ? { ...prev, loading: true, errorMsg: undefined } : prev);
                void runCompress(pw);
              }}
              onCancel={() => {
                setPasswordPrompt(null);
                setFiles([]);
                setPdfPassword(null);
              }}
            />
          )}

          

          {files.length === 0 ? (
            <ToolDropzone
              chooseLabel="Select PDF"
              hint="or drag and drop your PDF here"
              subHint="Any file size · PDF only"
              dragOver={dragOver}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onChooseFiles={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            fileInputAccept=".pdf"
            onFileInputChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-pd-border bg-pd-brand-muted px-3 py-2">
                <Minimize2 className="h-4 w-4 shrink-0 text-pd-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-pd-foreground">{files[0].name}</p>
                  <p className="text-xs text-pd-muted">{formatFileSize(files[0].size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 text-xs font-medium text-pd-brand hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="mt-3">
                <p id="compression-level-label" className="mb-1.5 text-xs font-semibold text-pd-foreground">Compression level</p>
                <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="compression-level-label">
                  <button
                    type="button"
                    onClick={() => setCompressionLevel('basic')}
                    aria-pressed={compressionLevel === 'basic'}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                      compressionLevel === 'basic'
                        ? 'border-pd-brand bg-pd-brand-muted text-pd-foreground'
                        : 'border-pd-border text-pd-muted hover:border-pd-brand/40'
                    )}
                  >
                    <Shield className="h-3.5 w-3.5 text-pd-brand" />
                    Basic
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompressionLevel('strong')}
                    aria-pressed={compressionLevel === 'strong'}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                      compressionLevel === 'strong'
                        ? 'border-pd-brand bg-pd-brand-muted text-pd-foreground'
                        : 'border-pd-border text-pd-muted hover:border-pd-brand/40'
                    )}
                  >
                    <Zap className="h-3.5 w-3.5 text-pd-brand" />
                    Strong
                  </button>
                </div>
              </div>
            </>
          )}

          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={files.length === 0}
            loading={processing}
            loadingLabel="Compressing your PDF..."
          >
            Compress PDF
          </ToolPrimaryButton>
        </>
      )}
    </ToolPageShell>
  );
}
