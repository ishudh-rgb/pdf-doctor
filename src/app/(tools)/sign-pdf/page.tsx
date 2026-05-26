'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PenTool, Upload, Loader2, Download, AlertCircle, ChevronRight, Type, ImageIcon, Eraser } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { SignaturePlacementPreview } from '@/components/tools/previews/signature-preview';
import {
  getSignaturePosition,
  type SignaturePlacement,
  type SignatureSize,
} from '@/lib/utils/signature-placement';
import { canvasToPngBlob, canvasToPngDataUrl } from '@/lib/utils/canvas-trim';

const RELATED_TOOLS = [
  { name: 'Protect PDF', href: '/protect-pdf', color: '#D32F2F' },
  { name: 'Merge PDF', href: '/merge-pdf', color: '#4CAF50' },
  { name: 'Compress PDF', href: '/compress-pdf', color: '#FF9800' },
  { name: 'Unlock PDF', href: '/unlock-pdf', color: '#00897B' },
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

  return (
    <>
      <Head>
        <title>Sign PDF Online Free | PDF Doctor</title>
        <meta name="description" content="Add your signature to any PDF document online for free. Draw, type, or upload your signature." />
      </Head>
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: '#E6531318' }}>
              <PenTool className="w-8 h-8" style={{ color: '#E65313' }} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign PDF</h1>
            <p className="text-gray-600 text-lg">Add your signature to any PDF document</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
              Pro Feature
            </span>
          </div>

          {!completed && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Upload PDF</h2>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
                    dragOver ? 'border-[#E65313] bg-[#E65313]/5' : 'border-gray-300 hover:border-[#E65313] hover:bg-gray-50'
                  )}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-700 font-medium mb-1">Drop a PDF file here or click to browse</p>
                  <p className="text-sm text-gray-500">Select a PDF to sign</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />

                {files.length > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg flex items-center gap-3">
                    <PenTool className="w-4 h-4 text-[#E65313]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{files[0].name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(files[0].size)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Create Signature</h2>

                <div className="flex gap-2 mb-6">
                  {([
                    { id: 'draw' as const, label: 'Draw', icon: PenTool },
                    { id: 'type' as const, label: 'Type', icon: Type },
                    { id: 'upload' as const, label: 'Upload', icon: ImageIcon },
                  ]).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSignatureTab(tab.id)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        signatureTab === tab.id
                          ? 'bg-[#E65313] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {signatureTab === 'draw' && (
                  <div>
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
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
                      onClick={clearCanvas}
                      className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <Eraser className="w-3.5 h-3.5" />
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E65313]/20 focus:border-[#E65313] text-lg"
                    />
                    {typedName && (
                      <div className="mt-4 p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
                        <p className="text-3xl italic text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                          {typedName}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Signature preview</p>
                      </div>
                    )}
                  </div>
                )}

                {signatureTab === 'upload' && (
                  <div>
                    <div
                      onClick={() => sigImageInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#E65313] hover:bg-gray-50 transition-all"
                    >
                      {signaturePreview ? (
                        <img src={signaturePreview} alt="Signature" className="max-h-24 mx-auto" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Click to upload signature image</p>
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">3. Place Signature</h2>
                  <p className="text-sm text-gray-500 mb-6">Choose where your signature should appear on the page.</p>
                  <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Which page to sign?
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={pageNumber}
                          onChange={(e) => setPageNumber(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full max-w-[160px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E65313]/20 focus:border-[#E65313]"
                        />
                        <p className="mt-1.5 text-xs text-gray-500">Usually page 1 for single-page forms, or the last page for contracts.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
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
                                  ? 'border-[#E65313] bg-[#E65313]/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              )}
                            >
                              <div className="relative mx-auto mb-2 aspect-[3/4] w-full max-w-[72px] rounded-md border border-slate-200 bg-white">
                                <div className="absolute inset-x-2 top-2 h-1 rounded bg-slate-100" />
                                <div className="absolute inset-x-2 top-4 h-1 rounded bg-slate-100" />
                                <span
                                  className={cn(
                                    'absolute bottom-2 h-2 w-6 rounded-sm bg-[#E65313]/70',
                                    option.id === 'bottom-left' && 'left-2',
                                    option.id === 'bottom-center' && 'left-1/2 -translate-x-1/2',
                                    option.id === 'bottom-right' && 'right-2'
                                  )}
                                />
                              </div>
                              <p className="text-center text-xs font-medium text-gray-800">{option.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
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
                                'rounded-lg px-4 py-2 text-sm font-medium border-2 transition-all',
                                signatureSize === option.id
                                  ? 'border-[#E65313] bg-[#E65313]/5 text-[#E65313]'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
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
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-8 flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={files.length === 0 || !hasSignature || processing}
                className={cn(
                  'mb-8 w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200',
                  files.length > 0 && hasSignature && !processing
                    ? 'bg-[#E65313] hover:bg-[#D84315] shadow-lg shadow-[#E65313]/25'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {processing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing your PDF...
                  </span>
                ) : 'Sign & Download'}
              </button>
            </>
          )}

          {completed && resultUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#E65313]/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-[#E65313]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">PDF Signed Successfully!</h2>
              <p className="text-gray-600 mb-6">Your signed document is ready to download.</p>
              <a
                href={resultUrl}
                download={resultFilename || 'signed.pdf'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E65313] hover:bg-[#D84315] text-white font-semibold rounded-xl shadow-lg shadow-[#E65313]/25 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                Download Signed PDF
              </a>
              <button
                onClick={() => { setCompleted(false); setFiles([]); setResultUrl(null); clearCanvas(); setTypedName(''); setSignatureImage(null); setSignaturePreview(null); }}
                className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign another document
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
