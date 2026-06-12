'use client';

import { useState, useRef, useCallback } from 'react';
import { Unlock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/file';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { mapFaqs, mapRelatedTools } from '@/components/tools/tool-helpers';
import {
  ToolDropzone,
  ToolErrorBanner,
  ToolPrimaryButton,
  ToolSuccessPanel,
} from '@/components/tools/tool-ui';

const RELATED_TOOLS = [
  { name: 'Protect PDF', href: '/protect-pdf' },
  { name: 'Sign PDF', href: '/sign-pdf' },
  { name: 'Merge PDF', href: '/merge-pdf' },
  { name: 'Compress PDF', href: '/compress-pdf' },
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
  const [resultSize, setResultSize] = useState(0);
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
      setResultSize(blob.size);
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Unlock PDF"
      description="Remove password from PDFs you own and can open"
      relatedTools={mapRelatedTools(RELATED_TOOLS)}
      faqs={mapFaqs(FAQS)}
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="PDF Unlocked Successfully!"
          description="Your unlocked PDF is ready to download."
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || 'unlocked.pdf'}
          downloadLabel="Download Unlocked PDF"
          resultSizeBytes={resultSize}
          resetLabel="Unlock another file"
          onReset={() => {
            setCompleted(false);
            setFiles([]);
            setResultUrl(null);
            setResultSize(0);
            setPassword('');
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="mb-1 text-sm font-semibold text-amber-800">Safe Unlock</p>
              <p className="text-sm leading-snug text-amber-700">
                Removes protection only from PDFs you own — enter the correct password to unlock.
                <br />
                We do not crack, bypass, or brute-force passwords.
              </p>
            </div>
          </div>

          <ToolDropzone
            hint="or drop files here"
            subHint="Select a PDF file to unlock"
            dragOver={dragOver}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onChooseFiles={() => fileInputRef.current?.click()}
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
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-pd-brand-muted p-3">
                <Unlock className="h-4 w-4 shrink-0 text-pd-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-pd-foreground">{files[0].name}</p>
                  <p className="text-xs text-pd-muted">{formatFileSize(files[0].size)}</p>
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-2 block text-sm font-semibold text-pd-foreground">PDF Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter the PDF password"
                    className="w-full rounded-xl border border-pd-border px-4 py-3 pr-12 focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-pd-muted transition-colors hover:text-pd-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={files.length === 0 || !password}
            loading={processing}
            loadingLabel="Unlocking your PDF..."
          >
            Unlock PDF
          </ToolPrimaryButton>
        </>
      )}
    </ToolPageShell>
  );
}
