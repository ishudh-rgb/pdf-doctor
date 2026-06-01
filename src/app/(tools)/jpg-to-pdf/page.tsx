'use client';

import { useState, useRef, useCallback } from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { mapFaqs, mapRelatedTools } from '@/components/tools/tool-helpers';
import { PdfLayoutPreview } from '@/components/tools/previews/pdf-layout-preview';
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
  { name: 'Word to PDF', href: '/word-to-pdf' },
];

const FAQS = [
  { q: 'What image formats are supported?', a: 'We support JPEG/JPG, PNG, and WebP image formats.' },
  { q: 'Can I convert multiple images into one PDF?', a: 'Yes! Upload multiple images and they will all be combined into a single PDF document. You can reorder them before converting.' },
  { q: 'Can I choose the page size?', a: 'Yes, you can choose between A4, US Letter, or Auto (which matches the image dimensions).' },
  { q: 'Is there a limit on the number of images?', a: 'You can convert up to 50 images at once into a single PDF.' },
];

type PageSize = 'a4' | 'letter' | 'auto';
type Orientation = 'portrait' | 'landscape';
type Margin = 'none' | 'small' | 'medium';

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [margin, setMargin] = useState<Margin>('small');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const imageFiles = Array.from(newFiles).filter(f =>
      f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/webp'
    );
    if (imageFiles.length === 0) return;

    const newPreviews = imageFiles.map(f => URL.createObjectURL(f));
    setFiles(prev => [...prev, ...imageFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
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
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const newFiles = [...files];
    const newPreviews = [...previews];
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    [newPreviews[index], newPreviews[targetIndex]] = [newPreviews[targetIndex], newPreviews[index]];
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("pageSize", pageSize);
      formData.append("orientation", orientation);
      formData.append("margin", margin === "medium" ? "normal" : margin);

      const res = await fetch('/api/tools/jpg-to-pdf', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to convert images to PDF.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename('images.pdf');
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    previews.forEach(p => URL.revokeObjectURL(p));
    setFiles([]);
    setPreviews([]);
    setCompleted(false);
    setResultUrl(null);
    setError(null);
  };

  return (
    <ToolPageShell
      title="JPG to PDF"
      description="Convert images to PDF document"
      splitWorkspace
      previewPlaceholder="Add images to preview PDF layout"
      relatedTools={mapRelatedTools(RELATED_TOOLS)}
      faqs={mapFaqs(FAQS)}
      preview={
        files.length > 0 && !completed ? (
          <PdfLayoutPreview
            pageSize={pageSize}
            orientation={orientation}
            margin={margin}
            imagePreviewUrl={previews[0] ?? null}
          />
        ) : undefined
      }
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="Images Converted to PDF!"
          description="Your PDF document is ready to download."
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || 'images.pdf'}
          downloadLabel="Download PDF"
          resetLabel="Convert more images"
          onReset={reset}
        />
      ) : (
        <>
          <ToolDropzone
            hint="Drop images here or click to browse"
            subHint="Supports JPG, PNG, and WebP"
            dragOver={dragOver}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onChooseFiles={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {files.length > 0 && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-lg border border-pd-border">
                    <img
                      src={previews[index]}
                      alt={file.name}
                      className="h-32 w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveFile(index, 'up'); }}
                        disabled={index === 0}
                        className="rounded-lg bg-white p-1.5 shadow disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5 text-pd-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveFile(index, 'down'); }}
                        disabled={index === files.length - 1}
                        className="rounded-lg bg-white p-1.5 shadow disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5 text-pd-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="rounded-lg bg-white p-1.5 shadow hover:bg-red-50"
                      >
                        <X className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                    <div className="p-1.5">
                      <p className="truncate text-xs text-pd-muted">{file.name}</p>
                      <p className="text-xs text-pd-muted/70">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-pd-foreground">Page Size</h3>
                  <div className="flex gap-3">
                    {([['a4', 'A4'], ['letter', 'Letter'], ['auto', 'Auto']] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPageSize(value)}
                        className={cn(
                          'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                          pageSize === value
                            ? 'border-pd-brand bg-pd-brand-muted text-pd-brand'
                            : 'border-pd-border text-pd-muted hover:border-pd-muted'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-pd-foreground">Orientation</h3>
                  <div className="flex gap-3">
                    {([['portrait', 'Portrait'], ['landscape', 'Landscape']] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOrientation(value)}
                        className={cn(
                          'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                          orientation === value
                            ? 'border-pd-brand bg-pd-brand-muted text-pd-brand'
                            : 'border-pd-border text-pd-muted hover:border-pd-muted'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-pd-foreground">Margin</h3>
                  <div className="flex gap-3">
                    {([['none', 'None'], ['small', 'Small'], ['medium', 'Medium']] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMargin(value)}
                        className={cn(
                          'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                          margin === value
                            ? 'border-pd-brand bg-pd-brand-muted text-pd-brand'
                            : 'border-pd-border text-pd-muted hover:border-pd-muted'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={files.length === 0}
            loading={processing}
            loadingLabel="Converting to PDF..."
          >
            {`Convert ${files.length} image${files.length !== 1 ? 's' : ''} to PDF`}
          </ToolPrimaryButton>
        </>
      )}
    </ToolPageShell>
  );
}
