'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Minimize2, Upload, Loader2, Download, AlertCircle, ChevronRight, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { CompressionLevelPreview } from '@/components/tools/previews/compression-preview';

const RELATED_TOOLS = [
  { name: 'Merge PDF', href: '/merge-pdf', color: '#4CAF50' },
  { name: 'Split PDF', href: '/split-pdf', color: '#2196F3' },
  { name: 'PDF to Word', href: '/pdf-to-word', color: '#1565C0' },
  { name: 'JPG to PDF', href: '/jpg-to-pdf', color: '#7B1FA2' },
];

const FAQS = [
  { q: 'How much can a PDF be compressed?', a: 'Compression results vary depending on the content. Files with images typically see 40-80% reduction, while text-heavy PDFs may see 10-30% reduction.' },
  { q: 'Will compression reduce the quality of my PDF?', a: 'Basic compression preserves quality while reducing size. Strong compression may slightly reduce image quality but keeps text crisp.' },
  { q: 'Is there a file size limit?', a: 'You can compress PDF files up to 50MB. For larger files, consider splitting them first.' },
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const pdfFiles = Array.from(newFiles).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      setFiles([pdfFiles[0]]);
      setOriginalSize(pdfFiles[0].size);
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
      formData.append('level', compressionLevel);

      const res = await fetch('/api/tools/compress-pdf', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to compress PDF. Please try again.');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename('compressed.pdf');
      const headerOriginal = res.headers.get('X-Original-Size');
      const headerCompressed = res.headers.get('X-Compressed-Size');
      setCompressedSize(headerCompressed ? parseInt(headerCompressed, 10) : blob.size);
      if (headerOriginal) setOriginalSize(parseInt(headerOriginal, 10));
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  const compressionPercentage = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#FF980018' }}>
              <Minimize2 className="w-8 h-8" style={{ color: '#FF9800' }} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Compress PDF</h1>
            <p className="text-gray-600 text-lg">Reduce your PDF file size without losing quality</p>
          </div>

          {!completed && (
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
            <div className="mb-8 flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm lg:mb-0">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
                  dragOver ? 'border-[#FF9800] bg-[#FF9800]/5' : 'border-gray-300 hover:border-[#FF9800] hover:bg-gray-50'
                )}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-700 font-medium mb-1">Drop a PDF file here or click to browse</p>
                <p className="text-sm text-gray-500">Select a PDF file to compress</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              {files.length > 0 && (
                <>
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg flex items-center gap-3">
                    <Minimize2 className="w-4 h-4 text-[#FF9800]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{files[0].name}</p>
                      <p className="text-xs text-gray-500">Original size: {formatFileSize(files[0].size)}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Compression Level</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setCompressionLevel('basic')}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all duration-200',
                          compressionLevel === 'basic'
                            ? 'border-[#FF9800] bg-[#FF9800]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Shield className="w-5 h-5 mb-2 text-[#FF9800]" />
                        <p className="text-sm font-semibold text-gray-800">Basic</p>
                        <p className="text-xs text-gray-500 mt-0.5">Recommended &middot; Good quality</p>
                      </button>
                      <button
                        onClick={() => setCompressionLevel('strong')}
                        className={cn(
                          'p-4 rounded-xl border-2 text-left transition-all duration-200',
                          compressionLevel === 'strong'
                            ? 'border-[#FF9800] bg-[#FF9800]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Zap className="w-5 h-5 mb-2 text-[#FF9800]" />
                        <p className="text-sm font-semibold text-gray-800">Strong</p>
                        <p className="text-xs text-gray-500 mt-0.5">Smaller file &middot; Lower quality</p>
                      </button>
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
                    ? 'bg-[#FF9800] hover:bg-[#F57C00] shadow-lg shadow-[#FF9800]/25'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Compressing your PDF...
                  </span>
                ) : 'Compress PDF'}
              </button>
            </div>

            {files.length > 0 && (
              <CompressionLevelPreview level={compressionLevel} originalSize={originalSize} />
            )}
            </div>
          )}

          {completed && resultUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#FF9800]/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#FF9800]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">PDF Compressed Successfully!</h2>

              {compressionPercentage === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                  This PDF is already well optimized. No further size reduction was possible without lowering quality.
                </p>
              ) : null}

              <div className="inline-flex items-center gap-6 p-4 bg-gray-50 rounded-xl mb-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Before</p>
                  <p className="text-sm font-bold text-gray-700">{formatFileSize(originalSize)}</p>
                </div>
                <div className="text-2xl text-gray-300">&rarr;</div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">After</p>
                  <p className="text-sm font-bold text-[#FF9800]">{formatFileSize(compressedSize)}</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Saved</p>
                  <p className="text-sm font-bold text-green-600">{compressionPercentage}%</p>
                </div>
              </div>

              <a
                href={resultUrl}
                download={resultFilename || 'compressed.pdf'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#FF9800] hover:bg-[#F57C00] text-white font-semibold rounded-xl shadow-lg shadow-[#FF9800]/25 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                Download Compressed PDF
              </a>
              <button
                onClick={() => { setCompleted(false); setFiles([]); setResultUrl(null); setCompressedSize(0); }}
                className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Compress another file
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
  );
}
