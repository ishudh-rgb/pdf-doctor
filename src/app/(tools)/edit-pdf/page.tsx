'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Pencil,
  Upload,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  X,
  Plus,
  Type,
  ImageIcon,
  Trash2,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { TOOLS } from '@/config/constants';
import type { FAQ } from '@/types';
import { EditPlacementPreview } from '@/components/tools/previews/edit-placement-preview';
const TOOL_COLOR = '#00897B';

interface TextItem {
  id: string;
  text: string;
  fontSize: number;
  x: number;
  y: number;
  page: number;
}

interface ImageItem {
  id: string;
  file: File;
  x: number;
  y: number;
  page: number;
}

const FAQS: FAQ[] = [
  {
    question: 'What types of edits can I make to a PDF?',
    answer:
      'You can add text with customizable font sizes and positions, insert images at specific locations, and place annotations on any page of your PDF document.',
  },
  {
    question: 'Will editing affect the original PDF quality?',
    answer:
      'No. Our editor preserves the original PDF quality. All additions are layered on top of the existing content without altering the underlying document.',
  },
  {
    question: 'Is there a page limit for editing?',
    answer:
      'Free users can edit PDFs up to 25 MB. Pro users can work with files up to 200 MB with no page limit restrictions.',
  },
];

const relatedTools = TOOLS.filter(
  (t) => t.slug !== 'edit-pdf'
).slice(0, 4);

export default function EditPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [showTextForm, setShowTextForm] = useState(false);
  const [showImageForm, setShowImageForm] = useState(false);

  const [newText, setNewText] = useState('');
  const [newFontSize, setNewFontSize] = useState(16);
  const [newTextX, setNewTextX] = useState(50);
  const [newTextY, setNewTextY] = useState(50);
  const [newTextPage, setNewTextPage] = useState(1);

  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageX, setNewImageX] = useState(50);
  const [newImageY, setNewImageY] = useState(50);
  const [newImagePage, setNewImagePage] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    if (dropped.length > 0) {
      setFiles([dropped[0]]);
      setError(null);
      setCompleted(false);
      setResultUrl(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFiles([selected]);
      setError(null);
      setCompleted(false);
      setResultUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addTextItem = () => {
    if (!newText.trim()) return;
    setTextItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: newText,
        fontSize: newFontSize,
        x: newTextX,
        y: newTextY,
        page: newTextPage,
      },
    ]);
    setNewText('');
    setShowTextForm(false);
  };

  const addImageItem = () => {
    if (!newImageFile) return;
    setImageItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        file: newImageFile,
        x: newImageX,
        y: newImageY,
        page: newImagePage,
      },
    ]);
    setNewImageFile(null);
    setShowImageForm(false);
  };

  const removeTextItem = (id: string) => {
    setTextItems((prev) => prev.filter((item) => item.id !== id));
  };

  const removeImageItem = (id: string) => {
    setImageItems((prev) => prev.filter((item) => item.id !== id));
  };

  const imagePreviewItems = useMemo(
    () =>
      imageItems.map((item) => ({
        previewUrl: URL.createObjectURL(item.file),
        x: item.x,
        y: item.y,
        page: item.page,
      })),
    [imageItems]
  );

  const draftImagePreviewUrl = useMemo(
    () => (newImageFile ? URL.createObjectURL(newImageFile) : null),
    [newImageFile]
  );

  const previewPage = showTextForm
    ? newTextPage
    : showImageForm
      ? newImagePage
      : textItems[0]?.page ?? imageItems[0]?.page ?? 1;

  const previewTextItems = useMemo(() => {
    const items: Array<{
      text: string;
      fontSize: number;
      x: number;
      y: number;
      page: number;
      draft?: boolean;
    }> = textItems.map((item) => ({
      text: item.text,
      fontSize: item.fontSize,
      x: item.x,
      y: item.y,
      page: item.page,
    }));

    if (showTextForm && newText.trim()) {
      items.push({
        text: newText,
        fontSize: newFontSize,
        x: newTextX,
        y: newTextY,
        page: newTextPage,
        draft: true,
      });
    }

    return items;
  }, [textItems, showTextForm, newText, newFontSize, newTextX, newTextY, newTextPage]);

  const previewImageItems = useMemo(() => {
    const items: Array<{
      previewUrl: string;
      x: number;
      y: number;
      page: number;
      draft?: boolean;
    }> = [...imagePreviewItems];

    if (showImageForm && draftImagePreviewUrl) {
      items.push({
        previewUrl: draftImagePreviewUrl,
        x: newImageX,
        y: newImageY,
        page: newImagePage,
        draft: true,
      });
    }

    return items;
  }, [
    imagePreviewItems,
    showImageForm,
    draftImagePreviewUrl,
    newImageX,
    newImageY,
    newImagePage,
  ]);

  useEffect(() => {
    return () => {
      imagePreviewItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      if (draftImagePreviewUrl) URL.revokeObjectURL(draftImagePreviewUrl);
    };
  }, [imagePreviewItems, draftImagePreviewUrl]);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append(
        'options',
        JSON.stringify({
          textItems: textItems.map(({ id, ...rest }) => rest),
          imageCount: imageItems.length,
        })
      );
      imageItems.forEach((img, i) => {
        formData.append(`image_${i}`, img.file);
        formData.append(
          `image_${i}_position`,
          JSON.stringify({ x: img.x, y: img.y, page: img.page })
        );
      });

      const res = await fetch('/api/tools/edit-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to process PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setTextItems([]);
    setImageItems([]);
    setProcessing(false);
    setCompleted(false);
    setError(null);
    setResultUrl(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2">
              <span className="rounded-full bg-gradient-to-r from-purple-600 to-teal-500 px-3 py-1 text-xs font-semibold text-white">
                Pro Feature
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${TOOL_COLOR}15` }}
              >
                <Pencil className="h-6 w-6" style={{ color: TOOL_COLOR }} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Edit PDF
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              Add text, images, and annotations to your PDF
            </p>
          </div>

          {/* Upload Area */}
          {files.length === 0 && !completed && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200',
                isDragging
                  ? 'border-[#00897B] bg-[#00897B]/5'
                  : 'border-gray-300 bg-white hover:border-[#00897B] hover:bg-gray-50'
              )}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">
                Drop your PDF here or click to browse
              </p>
              <p className="mt-2 text-sm text-gray-500">PDF files up to 25 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Editor */}
          {files.length > 0 && !completed && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8" style={{ color: TOOL_COLOR }} />
                  <div>
                    <p className="font-medium text-gray-900">{files[0].name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(files[0].size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Live placement preview */}
              <EditPlacementPreview
                page={previewPage}
                textItems={previewTextItems}
                imageItems={previewImageItems}
              />

              {/* Toolbar */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTextForm(true);
                    setShowImageForm(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: TOOL_COLOR }}
                >
                  <Type className="h-4 w-4" />
                  Add Text
                </button>
                <button
                  onClick={() => {
                    setShowImageForm(true);
                    setShowTextForm(false);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <ImageIcon className="h-4 w-4" />
                  Add Image
                </button>
              </div>

              {/* Add Text Form */}
              {showTextForm && (
                <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-900">Add Text</h3>
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#00897B] focus:outline-none focus:ring-1 focus:ring-[#00897B]"
                  />
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Font Size
                      </label>
                      <select
                        value={newFontSize}
                        onChange={(e) => setNewFontSize(Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00897B] focus:outline-none focus:ring-1 focus:ring-[#00897B]"
                      >
                        {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48].map(
                          (size) => (
                            <option key={size} value={size}>
                              {size}px
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        X Position
                      </label>
                      <input
                        type="number"
                        value={newTextX}
                        onChange={(e) => setNewTextX(Number(e.target.value))}
                        min={0}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00897B] focus:outline-none focus:ring-1 focus:ring-[#00897B]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Y Position
                      </label>
                      <input
                        type="number"
                        value={newTextY}
                        onChange={(e) => setNewTextY(Number(e.target.value))}
                        min={0}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00897B] focus:outline-none focus:ring-1 focus:ring-[#00897B]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Page
                      </label>
                      <input
                        type="number"
                        value={newTextPage}
                        onChange={(e) => setNewTextPage(Number(e.target.value))}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00897B] focus:outline-none focus:ring-1 focus:ring-[#00897B]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={addTextItem}
                      disabled={!newText.trim()}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: TOOL_COLOR }}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                    <button
                      onClick={() => setShowTextForm(false)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Add Image Form */}
              {showImageForm && (
                <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
                  <h3 className="font-semibold text-gray-900">Add Image</h3>
                  <div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewImageFile(e.target.files?.[0] ?? null)}
                      className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#00897B]/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#00897B] hover:file:bg-[#00897B]/20"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        X Position
                      </label>
                      <input
                        type="number"
                        value={newImageX}
                        onChange={(e) => setNewImageX(Number(e.target.value))}
                        min={0}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00897B] focus:outline-none focus:ring-1 focus:ring-[#00897B]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Y Position
                      </label>
                      <input
                        type="number"
                        value={newImageY}
                        onChange={(e) => setNewImageY(Number(e.target.value))}
                        min={0}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00897B] focus:outline-none focus:ring-1 focus:ring-[#00897B]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Page
                      </label>
                      <input
                        type="number"
                        value={newImagePage}
                        onChange={(e) => setNewImagePage(Number(e.target.value))}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00897B] focus:outline-none focus:ring-1 focus:ring-[#00897B]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={addImageItem}
                      disabled={!newImageFile}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: TOOL_COLOR }}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                    <button
                      onClick={() => setShowImageForm(false)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Added Items List */}
              {(textItems.length > 0 || imageItems.length > 0) && (
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-gray-900">
                    Added Elements ({textItems.length + imageItems.length})
                  </h3>
                  <div className="space-y-2">
                    {textItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Type className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-800">
                            &ldquo;{item.text}&rdquo;
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.fontSize}px &middot; ({item.x}, {item.y}) &middot;
                            Page {item.page}
                          </span>
                        </div>
                        <button
                          onClick={() => removeTextItem(item.id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {imageItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-800">
                            {item.file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({item.x}, {item.y}) &middot; Page {item.page}
                          </span>
                        </div>
                        <button
                          onClick={() => removeImageItem(item.id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handleProcess}
                disabled={processing}
                className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: TOOL_COLOR }}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Download className="h-5 w-5" />
                    Save & Download
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Success */}
          {completed && resultUrl && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: `${TOOL_COLOR}15` }}
              >
                <Pencil className="h-8 w-8" style={{ color: TOOL_COLOR }} />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                PDF Edited Successfully!
              </h2>
              <p className="mb-6 text-gray-600">
                Your edited PDF is ready to download.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a
                  href={resultUrl}
                  download="edited.pdf"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: TOOL_COLOR }}
                >
                  <Download className="h-5 w-5" />
                  Download Edited PDF
                </a>
                <button
                  onClick={reset}
                  className="rounded-xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Edit Another PDF
                </button>
              </div>
            </div>
          )}

          {/* Related Tools */}
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Related Tools
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  className="group rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div
                    className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${tool.color}15` }}
                  >
                    <FileText className="h-5 w-5" style={{ color: tool.color }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
                  <span
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium"
                    style={{ color: tool.color }}
                  >
                    Try it <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-16 mb-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <details
                  key={idx}
                  className="group rounded-xl bg-white shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-4 text-sm leading-relaxed text-gray-600">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
    </main>
  );
}
