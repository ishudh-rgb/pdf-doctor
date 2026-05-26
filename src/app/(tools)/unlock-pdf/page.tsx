'use client';

import { useState, useRef, useCallback } from 'react';
import { Unlock, Upload, Loader2, Download, AlertCircle, ChevronRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';

const RELATED_TOOLS = [
  { name: 'Protect PDF', href: '/protect-pdf', color: '#D32F2F' },
  { name: 'Sign PDF', href: '/sign-pdf', color: '#E65313' },
  { name: 'Merge PDF', href: '/merge-pdf', color: '#4CAF50' },
  { name: 'Compress PDF', href: '/compress-pdf', color: '#FF9800' },
];

const FAQS = [
  { q: 'Can this tool crack PDF passwords?', a: 'No. This tool only removes password protection from PDFs you own and can already open. You must provide the correct password.' },
  { q: 'What types of PDF protection can be removed?', a: 'We can remove password protection (user password) from PDFs. This does not bypass owner/permission passwords for copy-protected documents.' },
  { q: 'Is my password secure?', a: 'Yes. Your password is sent over a secure connection and is never stored. The file is processed and immediately deleted from our servers.' },
  { q: 'What if I forgot my PDF password?', a: 'Unfortunately, we cannot help recover forgotten passwords. You will need to contact the document creator for the correct password.' },
];

export default function UnlockPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    if (files.length === 0 || !password) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('password', password);

      const res = await fetch('/api/tools/unlock-pdf', { method: 'POST', body: formData });
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error('Incorrect password. Please try again.');
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to unlock PDF.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(files[0].name.replace('.pdf', '-unlocked.pdf'));
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>Unlock PDF Online Free | Remove PDF Password | PDF Doctor</title>
        <meta name="description" content="Remove password protection from PDFs you own. Unlock PDF files online securely and for free." />
      </Head>
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#00897B18' }}>
              <Unlock className="w-8 h-8" style={{ color: '#00897B' }} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Unlock PDF</h1>
            <p className="text-gray-600 text-lg">Remove password from PDFs you own and can open</p>
          </div>

          <div className="mb-8 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Safe Unlock</p>
              <p className="text-sm text-amber-700">
                This tool only removes password protection from PDFs that you own and can already open.
                You must provide the correct password. We do not crack, bypass, or brute-force passwords.
              </p>
            </div>
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
                  dragOver ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-300 hover:border-[#00897B] hover:bg-gray-50'
                )}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-700 font-medium mb-1">Drop a password-protected PDF here or click to browse</p>
                <p className="text-sm text-gray-500">Select a PDF file to unlock</p>
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
                  <div className="mt-4 p-3 bg-teal-50 rounded-lg flex items-center gap-3">
                    <Unlock className="w-4 h-4 text-[#00897B]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{files[0].name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(files[0].size)}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">PDF Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter the PDF password"
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                disabled={files.length === 0 || !password || processing}
                className={cn(
                  'mt-6 w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200',
                  files.length > 0 && password && !processing
                    ? 'bg-[#00897B] hover:bg-[#00796B] shadow-lg shadow-[#00897B]/25'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Unlocking your PDF...
                  </span>
                ) : 'Unlock PDF'}
              </button>
            </div>
          )}

          {completed && resultUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#00897B]/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#00897B]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">PDF Unlocked Successfully!</h2>
              <p className="text-gray-600 mb-6">Your unlocked PDF is ready to download.</p>
              <a
                href={resultUrl}
                download={resultFilename || 'unlocked.pdf'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#00897B] hover:bg-[#00796B] text-white font-semibold rounded-xl shadow-lg shadow-[#00897B]/25 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                Download Unlocked PDF
              </a>
              <button
                onClick={() => { setCompleted(false); setFiles([]); setResultUrl(null); setPassword(''); }}
                className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Unlock another file
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
