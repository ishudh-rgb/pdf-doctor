'use client';

import { useState, useRef, useCallback } from 'react';
import { FileText, Upload, Loader2, Download, AlertCircle, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';

const RELATED_TOOLS = [
  { name: 'Word to PDF', href: '/word-to-pdf', color: '#C62828' },
  { name: 'Merge PDF', href: '/merge-pdf', color: '#4CAF50' },
  { name: 'Compress PDF', href: '/compress-pdf', color: '#FF9800' },
  { name: 'Split PDF', href: '/split-pdf', color: '#2196F3' },
];

const FAQS = [
  { q: 'Will the formatting be preserved?', a: 'We do our best to maintain the original formatting including fonts, images, and layout. Complex layouts may have minor differences.' },
  { q: 'Can I convert scanned PDFs?', a: 'Yes! OCR (Optical Character Recognition) is automatically applied to scanned PDFs to extract text content.' },
  { q: 'What Word format is produced?', a: 'The output is in .docx format, compatible with Microsoft Word 2007 and later, Google Docs, and LibreOffice.' },
  { q: 'Is there a page limit?', a: 'You can convert PDFs up to 100 pages. For larger documents, consider splitting them first.' },
];

export default function PdfToWordPage() {
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
      formData.append('options', JSON.stringify({}));

      const res = await fetch('/api/tools/pdf-to-word', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to convert PDF to Word. Please try again.');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(files[0].name.replace(/\.pdf$/i, '.docx'));
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#1565C018' }}>
              <FileText className="w-8 h-8" style={{ color: '#1565C0' }} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF to Word</h1>
            <p className="text-gray-600 text-lg">Convert PDF documents to editable Word format</p>
          </div>

          {!completed && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
                  dragOver ? 'border-[#1565C0] bg-[#1565C0]/5' : 'border-gray-300 hover:border-[#1565C0] hover:bg-gray-50'
                )}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-700 font-medium mb-1">Drop a PDF file here or click to browse</p>
                <p className="text-sm text-gray-500">Select a PDF file to convert to Word</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              {files.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#1565C0]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{files[0].name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(files[0].size)}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50/50 rounded-lg text-sm text-blue-800">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>For scanned PDFs, OCR will be used to extract text.</p>
              </div>

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
                  'mt-6 w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200',
                  files.length > 0 && !processing
                    ? 'bg-[#1565C0] hover:bg-[#0D47A1] shadow-lg shadow-[#1565C0]/25'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Converting to Word...
                  </span>
                ) : 'Convert to Word'}
              </button>
            </div>
          )}

          {completed && resultUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1565C0]/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#1565C0]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Converted Successfully!</h2>
              <p className="text-gray-600 mb-6">Your Word document is ready to download.</p>
              <a
                href={resultUrl}
                download={resultFilename || 'converted.docx'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white font-semibold rounded-xl shadow-lg shadow-[#1565C0]/25 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                Download DOCX
              </a>
              <button
                onClick={() => { setCompleted(false); setFiles([]); setResultUrl(null); }}
                className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Convert another file
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
