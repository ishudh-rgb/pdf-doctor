'use client';

import { useState, useRef, useCallback } from 'react';
import { Lock, Upload, Loader2, Download, AlertCircle, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';

const RELATED_TOOLS = [
  { name: 'Unlock PDF', href: '/unlock-pdf', color: '#00897B' },
  { name: 'Sign PDF', href: '/sign-pdf', color: '#E65313' },
  { name: 'Merge PDF', href: '/merge-pdf', color: '#4CAF50' },
  { name: 'Compress PDF', href: '/compress-pdf', color: '#FF9800' },
];

const FAQS = [
  { q: 'How secure is the password protection?', a: 'We use AES-256 encryption to protect your PDF files. This is the same encryption standard used by banks and government agencies.' },
  { q: 'Can I remove the password later?', a: 'Yes! Use our Unlock PDF tool to remove the password protection. You will need the correct password to do so.' },
  { q: 'What makes a strong password?', a: 'A strong password is at least 8 characters long and includes a mix of uppercase letters, lowercase letters, numbers, and special characters.' },
  { q: 'Will password protection change the PDF content?', a: 'No. Password protection only adds an encryption layer. Your PDF content, formatting, and images remain exactly the same.' },
];

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'weak';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (password.length >= 8 && score >= 3) return 'strong';
  if (password.length >= 6 && score >= 2) return 'medium';
  return 'weak';
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; bg: string; width: string }> = {
  weak: { label: 'Weak', color: 'text-red-600', bg: 'bg-red-500', width: 'w-1/3' },
  medium: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-500', width: 'w-2/3' },
  strong: { label: 'Strong', color: 'text-green-600', bg: 'bg-green-500', width: 'w-full' },
};

export default function ProtectPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = files.length > 0 && password.length > 0 && passwordsMatch && !processing;

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
    if (!canSubmit) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('password', password);

      const res = await fetch('/api/tools/protect-pdf', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to protect PDF.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(files[0].name.replace('.pdf', '-protected.pdf'));
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
        <title>Protect PDF with Password Online | PDF Doctor</title>
        <meta name="description" content="Add password protection to your PDF files online. Secure your documents with AES-256 encryption for free." />
      </Head>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#D32F2F18' }}>
              <Lock className="w-8 h-8" style={{ color: '#D32F2F' }} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Protect PDF</h1>
            <p className="text-gray-600 text-lg">Add password protection to your PDF</p>
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
                  dragOver ? 'border-[#D32F2F] bg-[#D32F2F]/5' : 'border-gray-300 hover:border-[#D32F2F] hover:bg-gray-50'
                )}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-700 font-medium mb-1">Drop a PDF file here or click to browse</p>
                <p className="text-sm text-gray-500">Select a PDF to protect with a password</p>
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
                  <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-3">
                    <Lock className="w-4 h-4 text-[#D32F2F]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{files[0].name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(files[0].size)}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter a password"
                          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full transition-all duration-300', strengthConfig[passwordStrength].bg, strengthConfig[passwordStrength].width)} />
                            </div>
                            <span className={cn('text-xs font-medium', strengthConfig[passwordStrength].color)}>
                              {strengthConfig[passwordStrength].label}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          className={cn(
                            'w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2',
                            confirmPassword && !passwordsMatch
                              ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                              : 'border-gray-200 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && !passwordsMatch && (
                        <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                      )}
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
                disabled={!canSubmit}
                className={cn(
                  'mt-6 w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200',
                  canSubmit
                    ? 'bg-[#D32F2F] hover:bg-[#C62828] shadow-lg shadow-[#D32F2F]/25'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Protecting your PDF...
                  </span>
                ) : 'Protect PDF'}
              </button>
            </div>
          )}

          {completed && resultUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#D32F2F]/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#D32F2F]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">PDF Protected Successfully!</h2>
              <p className="text-gray-600 mb-6">Your password-protected PDF is ready to download.</p>
              <a
                href={resultUrl}
                download={resultFilename || 'protected.pdf'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D32F2F] hover:bg-[#C62828] text-white font-semibold rounded-xl shadow-lg shadow-[#D32F2F]/25 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                Download Protected PDF
              </a>
              <button
                onClick={() => { setCompleted(false); setFiles([]); setResultUrl(null); setPassword(''); setConfirmPassword(''); }}
                className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Protect another file
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
      </div>
    </>
  );
}
