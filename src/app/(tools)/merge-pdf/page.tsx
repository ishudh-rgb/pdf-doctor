'use client';

import { useState, useRef, useCallback } from 'react';
import { Layers, Upload, X, ArrowUp, ArrowDown, Loader2, Download, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';

const RELATED_TOOLS = [
  { name: 'Split PDF', href: '/split-pdf', color: '#2196F3' },
  { name: 'Compress PDF', href: '/compress-pdf', color: '#FF9800' },
  { name: 'PDF to Word', href: '/pdf-to-word', color: '#1565C0' },
  { name: 'JPG to PDF', href: '/jpg-to-pdf', color: '#7B1FA2' },
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
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename('merged.pdf');
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#4CAF5018' }}>
              <Layers className="w-8 h-8" style={{ color: '#4CAF50' }} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Merge PDF</h1>
            <p className="text-gray-600 text-lg">Combine multiple PDF files into a single document</p>
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
                  dragOver ? 'border-[#4CAF50] bg-[#4CAF50]/5' : 'border-gray-300 hover:border-[#4CAF50] hover:bg-gray-50'
                )}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-700 font-medium mb-1">Drop PDF files here or click to browse</p>
                <p className="text-sm text-gray-500">Select multiple PDF files to merge</p>
              </div>
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
                    <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveFile(index, 'up')} disabled={index === 0} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                          <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button onClick={() => moveFile(index, 'down')} disabled={index === files.length - 1} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                          <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <button onClick={() => removeFile(index)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={files.length < 2 || processing}
                className={cn(
                  'mt-6 w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200',
                  files.length >= 2 && !processing
                    ? 'bg-[#4CAF50] hover:bg-[#43A047] shadow-lg shadow-[#4CAF50]/25'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Merging your PDFs...
                  </span>
                ) : (
                  `Merge ${files.length} PDF${files.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          )}

          {completed && resultUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#4CAF50]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">PDFs Merged Successfully!</h2>
              <p className="text-gray-600 mb-6">Your merged document is ready to download.</p>
              <a
                href={resultUrl}
                download={resultFilename || 'merged.pdf'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#4CAF50] hover:bg-[#43A047] text-white font-semibold rounded-xl shadow-lg shadow-[#4CAF50]/25 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                Download Merged PDF
              </a>
              <button
                onClick={() => { setCompleted(false); setFiles([]); setResultUrl(null); }}
                className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Merge more files
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
