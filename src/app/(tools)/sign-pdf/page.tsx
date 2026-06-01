'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PenTool, Type, ImageIcon, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { mapFaqs, mapRelatedTools } from '@/components/tools/tool-helpers';
import { SignaturePlacementPreview } from '@/components/tools/previews/signature-preview';
import {
  getSignaturePosition,
  type SignaturePlacement,
  type SignatureSize,
} from '@/lib/utils/signature-placement';
import { canvasToPngBlob, canvasToPngDataUrl } from '@/lib/utils/canvas-trim';
import {
  ToolDropzone,
  ToolErrorBanner,
  ToolPrimaryButton,
  ToolSuccessPanel,
} from '@/components/tools/tool-ui';

const RELATED_TOOLS = [
  { name: 'Protect PDF', href: '/protect-pdf' },
  { name: 'Merge PDF', href: '/merge-pdf' },
  { name: 'Compress PDF', href: '/compress-pdf' },
  { name: 'Unlock PDF', href: '/unlock-pdf' },
];

const FAQS = [
  { q: 'Is my signature secure?', a: 'Your signature is processed entirely in your browser and on our secure servers. We never store your signature data.' },
  { q: 'What types of signatures can I add?', a: 'You can draw a signature, type your name in a signature style, or upload an image of your signature.' },
  { q: 'Can I place the signature on a specific page?', a: 'Yes. Choose the page number and pick where the signature should appear — bottom left, center, or right.' },
  { q: 'Is this a legally binding e-signature?', a: 'This tool adds a visual signature to your PDF. For legally binding e-signatures, consider using a dedicated e-signature service.' },
];

type SignatureTab = 'draw' | 'type' | 'upload';

export default function SignPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [signatureTab, setSignatureTab] = useState<SignatureTab>('draw');
  const [typedName, setTypedName] = useState('');
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigImageInputRef = useRef<HTMLInputElement>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [placement, setPlacement] = useState<SignaturePlacement>('bottom-right');
  const [signatureSize, setSignatureSize] = useState<SignatureSize>('medium');
  const [placementPreviewUrl, setPlacementPreviewUrl] = useState<string | null>(null);
  const [drawRevision, setDrawRevision] = useState(0);

  const signaturePosition = getSignaturePosition(placement, signatureSize);

  const refreshDrawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      setPlacementPreviewUrl(null);
      return;
    }
    setPlacementPreviewUrl(canvasToPngDataUrl(canvas));
  }, [hasDrawn]);

  useEffect(() => {
    if (signatureTab === 'draw') {
      refreshDrawPreview();
      return;
    }

    if (signatureTab === 'type') {
      if (!typedName.trim()) {
        setPlacementPreviewUrl(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      ctx.font = 'italic 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 200, 75);
      setPlacementPreviewUrl(canvas.toDataURL('image/png'));
      return;
    }

    setPlacementPreviewUrl(signaturePreview);
  }, [signatureTab, hasDrawn, typedName, signaturePreview, drawRevision, refreshDrawPreview]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [signatureTab]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setDrawRevision((value) => value + 1);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setPlacementPreviewUrl(null);
    setDrawRevision((value) => value + 1);
  };

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

  const handleSigImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSignatureImage(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const getSignatureBlob = async (): Promise<Blob | null> => {
    if (signatureTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return null;
      return canvasToPngBlob(canvas);
    }

    if (signatureTab === 'type') {
      if (!typedName.trim()) return null;
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      ctx.font = 'italic 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 200, 75);
      return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'));
    }

    if (signatureTab === 'upload' && signatureImage) {
      return signatureImage;
    }

    return null;
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please upload a PDF file first.');
      return;
    }

    const sigBlob = await getSignatureBlob();
    if (!sigBlob) {
      setError('Please create a signature first.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('signature', sigBlob, 'signature.png');
      formData.append('position', JSON.stringify({
        page: pageNumber,
        x: signaturePosition.x,
        y: signaturePosition.y,
        width: signaturePosition.width,
        height: signaturePosition.height,
      }));

      const res = await fetch('/api/tools/sign-pdf', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to sign PDF.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(files[0].name.replace('.pdf', '-signed.pdf'));
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  const hasSignature = (signatureTab === 'draw' && hasDrawn) ||
    (signatureTab === 'type' && typedName.trim().length > 0) ||
    (signatureTab === 'upload' && signatureImage !== null);

  const showPreview = hasSignature && files.length > 0 && !completed;

  return (
    <ToolPageShell
      title="Sign PDF"
      description="Add your signature to any PDF document"
      splitWorkspace
      previewPlaceholder="Add a signature to see placement preview"
      relatedTools={mapRelatedTools(RELATED_TOOLS)}
      faqs={mapFaqs(FAQS)}
      preview={
        showPreview ? (
          <SignaturePlacementPreview
            signatureImageUrl={placementPreviewUrl}
            pageNumber={pageNumber}
            placement={placement}
            size={signatureSize}
            posX={signaturePosition.x}
            posY={signaturePosition.y}
            sigWidth={signaturePosition.width}
            sigHeight={signaturePosition.height}
          />
        ) : undefined
      }
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="PDF Signed Successfully!"
          description="Your signed document is ready to download."
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || 'signed.pdf'}
          downloadLabel="Download Signed PDF"
          resetLabel="Sign another document"
          onReset={() => {
            setCompleted(false);
            setFiles([]);
            setResultUrl(null);
            clearCanvas();
            setTypedName('');
            setSignatureImage(null);
            setSignaturePreview(null);
          }}
        />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-pd-foreground">1. Upload PDF</h2>
            <ToolDropzone
              hint="or drop files here"
              subHint="Select a PDF to sign"
              dragOver={dragOver}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onChooseFiles={() => fileInputRef.current?.click()}
              onCloudFiles={(incoming) => handleFiles(incoming)}
              onCloudError={setError}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />

            {files.length > 0 && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-pd-brand-muted p-3">
                <PenTool className="h-4 w-4 shrink-0 text-pd-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-pd-foreground">{files[0].name}</p>
                  <p className="text-xs text-pd-muted">{formatFileSize(files[0].size)}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-pd-foreground">2. Create Signature</h2>

            <div className="mb-6 flex gap-2">
              {([
                { id: 'draw' as const, label: 'Draw', icon: PenTool },
                { id: 'type' as const, label: 'Type', icon: Type },
                { id: 'upload' as const, label: 'Upload', icon: ImageIcon },
              ]).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSignatureTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                    signatureTab === tab.id
                      ? 'bg-pd-brand text-white'
                      : 'bg-pd-background text-pd-muted hover:bg-pd-border/50'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {signatureTab === 'draw' && (
              <div>
                <div className="overflow-hidden rounded-xl border-2 border-pd-border bg-pd-surface">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full cursor-crosshair touch-none"
                    style={{ height: '200px' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="mt-2 flex items-center gap-1.5 text-sm text-pd-muted transition-colors hover:text-pd-foreground"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            )}

            {signatureTab === 'type' && (
              <div>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your name"
                  className="w-full rounded-xl border border-pd-border px-4 py-3 text-lg focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
                />
                {typedName && (
                  <div className="mt-4 rounded-xl border-2 border-dashed border-pd-border p-6 text-center">
                    <p className="text-3xl italic text-pd-foreground" style={{ fontFamily: 'Georgia, serif' }}>
                      {typedName}
                    </p>
                    <p className="mt-2 text-xs text-pd-muted">Signature preview</p>
                  </div>
                )}
              </div>
            )}

            {signatureTab === 'upload' && (
              <div>
                <div
                  onClick={() => sigImageInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-pd-border p-8 text-center transition-all hover:border-pd-brand hover:bg-pd-background"
                >
                  {signaturePreview ? (
                    <img src={signaturePreview} alt="Signature" className="mx-auto max-h-24" />
                  ) : (
                    <>
                      <ImageIcon className="mx-auto mb-2 h-8 w-8 text-pd-muted" />
                      <p className="text-sm text-pd-muted">Click to upload signature image</p>
                    </>
                  )}
                </div>
                <input
                  ref={sigImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSigImageChange}
                />
              </div>
            )}
          </div>

          {hasSignature && files.length > 0 && (
            <div>
              <h2 className="mb-1 text-lg font-semibold text-pd-foreground">3. Place Signature</h2>
              <p className="mb-6 text-sm text-pd-muted">Choose where your signature should appear on the page.</p>
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-pd-foreground">
                    Which page to sign?
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pageNumber}
                    onChange={(e) => setPageNumber(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full max-w-[160px] rounded-lg border border-pd-border px-3 py-2 focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
                  />
                  <p className="mt-1.5 text-xs text-pd-muted">Usually page 1 for single-page forms, or the last page for contracts.</p>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-pd-foreground">
                    Signature position
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { id: 'bottom-left' as const, label: 'Bottom left' },
                      { id: 'bottom-center' as const, label: 'Bottom center' },
                      { id: 'bottom-right' as const, label: 'Bottom right' },
                    ]).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPlacement(option.id)}
                        className={cn(
                          'rounded-xl border-2 p-3 text-left transition-all',
                          placement === option.id
                            ? 'border-pd-brand bg-pd-brand-muted'
                            : 'border-pd-border hover:border-pd-muted'
                        )}
                      >
                        <div className="relative mx-auto mb-2 aspect-[3/4] w-full max-w-[72px] rounded-md border border-pd-border bg-pd-surface">
                          <div className="absolute inset-x-2 top-2 h-1 rounded bg-pd-background" />
                          <div className="absolute inset-x-2 top-4 h-1 rounded bg-pd-background" />
                          <span
                            className={cn(
                              'absolute bottom-2 h-2 w-6 rounded-sm bg-pd-brand/70',
                              option.id === 'bottom-left' && 'left-2',
                              option.id === 'bottom-center' && 'left-1/2 -translate-x-1/2',
                              option.id === 'bottom-right' && 'right-2'
                            )}
                          />
                        </div>
                        <p className="text-center text-xs font-medium text-pd-foreground">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-pd-foreground">
                    Signature size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { id: 'small' as const, label: 'Small' },
                      { id: 'medium' as const, label: 'Medium' },
                      { id: 'large' as const, label: 'Large' },
                    ]).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSignatureSize(option.id)}
                        className={cn(
                          'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                          signatureSize === option.id
                            ? 'border-pd-brand bg-pd-brand-muted text-pd-brand'
                            : 'border-pd-border text-pd-muted hover:border-pd-muted'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={files.length === 0 || !hasSignature}
            loading={processing}
            loadingLabel="Signing your PDF..."
            className="mt-0"
          >
            Sign & Download
          </ToolPrimaryButton>
        </div>
      )}
    </ToolPageShell>
  );
}
