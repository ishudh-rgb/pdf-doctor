'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Scissors, Upload, Loader2, Download, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { SplitRangePreview } from '@/components/tools/previews/split-preview';
import { getPdfPageCount } from '@/lib/utils/pdf-page-count';

const RELATED_TOOLS = [
  { name: 'Merge PDF', href: '/merge-pdf', color: '#4CAF50' },
  { name: 'Compress PDF', href: '/compress-pdf', color: '#FF9800' },
  { name: 'PDF to Word', href: '/pdf-to-word', color: '#1565C0' },
  { name: 'Word to PDF', href: '/word-to-pdf', color: '#C62828' },
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
    <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#2196F318' }}>
              <Scissors className="w-8 h-8" style={{ color: '#2196F3' }} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Split PDF</h1>
            <p className="text-gray-600 text-lg">Split a PDF into separate pages or custom ranges</p>
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
                  dragOver ? 'border-[#2196F3] bg-[#2196F3]/5' : 'border-gray-300 hover:border-[#2196F3] hover:bg-gray-50'
                )}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-700 font-medium mb-1">Drop a PDF file here or click to browse</p>
                <p className="text-sm text-gray-500">Select a PDF file to split</p>
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
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                    <Scissors className="w-4 h-4 text-[#2196F3]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{files[0].name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(files[0].size)}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">Split Options</h3>
                    <label className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      splitMode === 'all' ? 'border-[#2196F3] bg-[#2196F3]/5' : 'border-gray-200 hover:border-gray-300'
                    )}>
                      <input type="radio" name="splitMode" checked={splitMode === 'all'} onChange={() => setSplitMode('all')} className="accent-[#2196F3]" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Split all pages</p>
                        <p className="text-xs text-gray-500">Each page becomes a separate PDF</p>
                      </div>
                    </label>
                    <label className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      splitMode === 'range' ? 'border-[#2196F3] bg-[#2196F3]/5' : 'border-gray-200 hover:border-gray-300'
                    )}>
                      <input type="radio" name="splitMode" checked={splitMode === 'range'} onChange={() => setSplitMode('range')} className="mt-0.5 accent-[#2196F3]" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">Split by range</p>
                        <p className="text-xs text-gray-500 mb-2">Extract specific pages</p>
                        {splitMode === 'range' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={startPage}
                              onChange={(e) => setStartPage(e.target.value)}
                              placeholder="Start"
                              className="w-20 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#2196F3]"
                            />
                            <span className="text-sm text-gray-500">to</span>
                            <input
                              type="number"
                              min="1"
                              value={endPage}
                              onChange={(e) => setEndPage(e.target.value)}
                              placeholder="End"
                              className="w-20 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#2196F3]"
                            />
                          </div>
                        )}
                      </div>
                    </label>
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
                    ? 'bg-[#2196F3] hover:bg-[#1E88E5] shadow-lg shadow-[#2196F3]/25'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Splitting your PDF...
                  </span>
                ) : 'Split PDF'}
              </button>
            </div>

            {files.length > 0 && (
              <SplitRangePreview
                splitMode={splitMode}
                startPage={startPage}
                endPage={endPage}
                totalPages={totalPages}
              />
            )}
            </div>
          )}

          {completed && resultUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#2196F3]/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#2196F3]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">PDF Split Successfully!</h2>
              <p className="text-gray-600 mb-6">
                {resultFilename?.endsWith('.zip')
                  ? 'Each page is saved as a separate PDF inside a ZIP file.'
                  : 'Your split document is ready to download.'}
              </p>
              <a
                href={resultUrl}
                download={resultFilename || 'split.pdf'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#2196F3] hover:bg-[#1E88E5] text-white font-semibold rounded-xl shadow-lg shadow-[#2196F3]/25 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                {resultFilename?.endsWith('.zip') ? 'Download ZIP File' : 'Download Split PDF'}
              </a>
              <button
                onClick={() => { setCompleted(false); setFiles([]); setResultUrl(null); }}
                className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Split another file
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
