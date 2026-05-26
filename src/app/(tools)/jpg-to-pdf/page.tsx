'use client';

import { useState, useRef, useCallback } from 'react';
import { Image, Upload, ArrowUp, ArrowDown, X, Loader2, Download, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { PdfLayoutPreview } from '@/components/tools/previews/pdf-layout-preview';

const RELATED_TOOLS = [
  { name: 'PDF to Word', href: '/pdf-to-word', color: '#1565C0' },
  { name: 'Merge PDF', href: '/merge-pdf', color: '#4CAF50' },
  { name: 'Compress PDF', href: '/compress-pdf', color: '#FF9800' },
  { name: 'Word to PDF', href: '/word-to-pdf', color: '#1565C0' },
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
    <>
      <Head>
        <title>Convert JPG to PDF Online Free | PDF Doctor</title>
        <meta name="description" content="Convert JPG, PNG, and WebP images to PDF online for free. Combine multiple images into one PDF document." />
      </Head>
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#7B1FA218' }}>
              <Image className="w-8 h-8" style={{ color: '#7B1FA2' }} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">JPG to PDF</h1>
            <p className="text-gray-600 text-lg">Convert images to PDF document</p>
          </div>

          {!completed && (
            <div className={cn(files.length > 0 && 'grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch')}>
            <div className="mb-8 flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm lg:mb-0">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
                  dragOver ? 'border-[#7B1FA2] bg-[#7B1FA2]/5' : 'border-gray-300 hover:border-[#7B1FA2] hover:bg-gray-50'
                )}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-700 font-medium mb-1">Drop images here or click to browse</p>
                <p className="text-sm text-gray-500">Supports JPG, PNG, and WebP</p>
              </div>
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
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={previews[index]}
                          alt={file.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveFile(index, 'up'); }}
                            disabled={index === 0}
                            className="p-1.5 bg-white rounded-lg shadow disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5 text-gray-700" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveFile(index, 'down'); }}
                            disabled={index === files.length - 1}
                            className="p-1.5 bg-white rounded-lg shadow disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5 text-gray-700" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                            className="p-1.5 bg-white rounded-lg shadow hover:bg-red-50"
                          >
                            <X className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                        <div className="p-1.5">
                          <p className="text-xs text-gray-600 truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Page Size</h3>
                      <div className="flex gap-3">
                        {([['a4', 'A4'], ['letter', 'Letter'], ['auto', 'Auto']] as const).map(([value, label]) => (
                          <button
                            key={value}
                            onClick={() => setPageSize(value)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                              pageSize === value
                                ? 'border-[#7B1FA2] bg-[#7B1FA2]/5 text-[#7B1FA2]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Orientation</h3>
                      <div className="flex gap-3">
                        {([['portrait', 'Portrait'], ['landscape', 'Landscape']] as const).map(([value, label]) => (
                          <button
                            key={value}
                            onClick={() => setOrientation(value)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                              orientation === value
                                ? 'border-[#7B1FA2] bg-[#7B1FA2]/5 text-[#7B1FA2]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Margin</h3>
                      <div className="flex gap-3">
                        {([['none', 'None'], ['small', 'Small'], ['medium', 'Medium']] as const).map(([value, label]) => (
                          <button
                            key={value}
                            onClick={() => setMargin(value)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                              margin === value
                                ? 'border-[#7B1FA2] bg-[#7B1FA2]/5 text-[#7B1FA2]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
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

              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={files.length === 0 || processing}
                className={cn(
                  'mt-auto w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 pt-6',
                  files.length > 0 && !processing
                    ? 'bg-[#7B1FA2] hover:bg-[#6A1B9A] shadow-lg shadow-[#7B1FA2]/25'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Converting to PDF...
                  </span>
                ) : `Convert ${files.length} image${files.length !== 1 ? 's' : ''} to PDF`}
              </button>
            </div>

            {files.length > 0 && (
              <PdfLayoutPreview
                pageSize={pageSize}
                orientation={orientation}
                margin={margin}
                imagePreviewUrl={previews[0] ?? null}
              />
            )}
            </div>
          )}

          {completed && resultUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#7B1FA2]/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#7B1FA2]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Images Converted to PDF!</h2>
              <p className="text-gray-600 mb-6">Your PDF document is ready to download.</p>
              <a
                href={resultUrl}
                download={resultFilename || 'images.pdf'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#7B1FA2] hover:bg-[#6A1B9A] text-white font-semibold rounded-xl shadow-lg shadow-[#7B1FA2]/25 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </a>
              <button
                onClick={reset}
                className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Convert more images
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {RELATED_TOOLS.map(tool => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tool.color }} />
                  <span className="text-sm font-medium text-gray-700">{tool.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <details key={i} className="group border border-gray-100 rounded-xl">
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-gray-800 hover:bg-gray-50 rounded-xl transition-colors">
                    {faq.q}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
