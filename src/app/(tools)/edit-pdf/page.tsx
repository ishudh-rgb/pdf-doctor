'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Upload,
  FileText,
  X,
  Plus,
  Type,
  ImageIcon,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatFileSize } from '@/lib/utils/file';
import { TOOLS } from '@/config/constants';
import type { FAQ } from '@/types';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { mapRelatedTools } from '@/components/tools/tool-helpers';
import { EditPlacementPreview } from '@/components/tools/previews/edit-placement-preview';
import {
  ToolErrorBanner,
  ToolPrimaryButton,
  ToolSuccessPanel,
} from '@/components/tools/tool-ui';
import { Button } from '@/components/ui/button';

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

const relatedTools = TOOLS.filter((t) => t.slug !== 'edit-pdf').slice(0, 4);

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
    <ToolPageShell
      title="Edit PDF"
      description="Add text, images, and annotations to your PDF"
      relatedTools={mapRelatedTools(relatedTools.map((t) => ({ name: t.name, href: `/${t.slug}` })))}
      faqs={FAQS}
      preview={
        files.length > 0 && !completed ? (
          <EditPlacementPreview
            page={previewPage}
            textItems={previewTextItems}
            imageItems={previewImageItems}
          />
        ) : undefined
      }
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="PDF Edited Successfully!"
          description="Your edited PDF is ready to download."
          downloadUrl={resultUrl}
          downloadFilename="edited.pdf"
          downloadLabel="Download Edited PDF"
          resetLabel="Edit Another PDF"
          onReset={reset}
        />
      ) : files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200',
            isDragging
              ? 'border-pd-brand bg-pd-brand-muted'
              : 'border-pd-border hover:border-pd-brand/50 hover:bg-pd-background'
          )}
        >
          <Upload className="mx-auto mb-4 h-12 w-12 text-pd-muted" />
          <p className="text-lg font-medium text-pd-foreground">
            Drop your PDF here or click to browse
          </p>
          <p className="mt-2 text-sm text-pd-muted">PDF files up to 25 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-pd-border bg-pd-background p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-pd-brand" />
              <div>
                <p className="font-medium text-pd-foreground">{files[0].name}</p>
                <p className="text-sm text-pd-muted">{formatFileSize(files[0].size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg p-2 text-pd-muted transition-colors hover:bg-pd-border/50 hover:text-pd-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => {
                setShowTextForm(true);
                setShowImageForm(false);
              }}
            >
              <Type className="h-4 w-4" />
              Add Text
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowImageForm(true);
                setShowTextForm(false);
              }}
            >
              <ImageIcon className="h-4 w-4" />
              Add Image
            </Button>
          </div>

          {showTextForm && (
            <div className="space-y-4 rounded-xl border border-pd-border bg-pd-background p-6">
              <h3 className="font-semibold text-pd-foreground">Add Text</h3>
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter text..."
                className="w-full rounded-lg border border-pd-border px-4 py-2.5 text-sm focus:border-pd-brand focus:outline-none focus:ring-1 focus:ring-pd-brand"
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-pd-muted">Font Size</label>
                  <select
                    value={newFontSize}
                    onChange={(e) => setNewFontSize(Number(e.target.value))}
                    className="w-full rounded-lg border border-pd-border px-3 py-2 text-sm focus:border-pd-brand focus:outline-none focus:ring-1 focus:ring-pd-brand"
                  >
                    {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48].map((size) => (
                      <option key={size} value={size}>{size}px</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-pd-muted">X Position</label>
                  <input
                    type="number"
                    value={newTextX}
                    onChange={(e) => setNewTextX(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-lg border border-pd-border px-3 py-2 text-sm focus:border-pd-brand focus:outline-none focus:ring-1 focus:ring-pd-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-pd-muted">Y Position</label>
                  <input
                    type="number"
                    value={newTextY}
                    onChange={(e) => setNewTextY(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-lg border border-pd-border px-3 py-2 text-sm focus:border-pd-brand focus:outline-none focus:ring-1 focus:ring-pd-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-pd-muted">Page</label>
                  <input
                    type="number"
                    value={newTextPage}
                    onChange={(e) => setNewTextPage(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-lg border border-pd-border px-3 py-2 text-sm focus:border-pd-brand focus:outline-none focus:ring-1 focus:ring-pd-brand"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" onClick={addTextItem} disabled={!newText.trim()}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowTextForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showImageForm && (
            <div className="space-y-4 rounded-xl border border-pd-border bg-pd-background p-6">
              <h3 className="font-semibold text-pd-foreground">Add Image</h3>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setNewImageFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-pd-muted file:mr-4 file:rounded-lg file:border-0 file:bg-pd-brand-muted file:px-4 file:py-2 file:text-sm file:font-medium file:text-pd-brand hover:file:bg-pd-brand-muted/80"
              />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-pd-muted">X Position</label>
                  <input
                    type="number"
                    value={newImageX}
                    onChange={(e) => setNewImageX(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-lg border border-pd-border px-3 py-2 text-sm focus:border-pd-brand focus:outline-none focus:ring-1 focus:ring-pd-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-pd-muted">Y Position</label>
                  <input
                    type="number"
                    value={newImageY}
                    onChange={(e) => setNewImageY(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-lg border border-pd-border px-3 py-2 text-sm focus:border-pd-brand focus:outline-none focus:ring-1 focus:ring-pd-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-pd-muted">Page</label>
                  <input
                    type="number"
                    value={newImagePage}
                    onChange={(e) => setNewImagePage(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-lg border border-pd-border px-3 py-2 text-sm focus:border-pd-brand focus:outline-none focus:ring-1 focus:ring-pd-brand"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" onClick={addImageItem} disabled={!newImageFile}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowImageForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {(textItems.length > 0 || imageItems.length > 0) && (
            <div className="rounded-xl border border-pd-border bg-pd-background p-6">
              <h3 className="mb-4 font-semibold text-pd-foreground">
                Added Elements ({textItems.length + imageItems.length})
              </h3>
              <div className="space-y-2">
                {textItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-pd-surface px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Type className="h-4 w-4 text-pd-muted" />
                      <span className="text-sm font-medium text-pd-foreground">
                        &ldquo;{item.text}&rdquo;
                      </span>
                      <span className="text-xs text-pd-muted">
                        {item.fontSize}px &middot; ({item.x}, {item.y}) &middot; Page {item.page}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTextItem(item.id)}
                      className="rounded p-1 text-pd-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {imageItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-pd-surface px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-4 w-4 text-pd-muted" />
                      <span className="text-sm font-medium text-pd-foreground">{item.file.name}</span>
                      <span className="text-xs text-pd-muted">
                        ({item.x}, {item.y}) &middot; Page {item.page}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImageItem(item.id)}
                      className="rounded p-1 text-pd-muted transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={processing}
            loading={processing}
            loadingLabel="Processing..."
            className="mt-0"
          >
            Save & Download
          </ToolPrimaryButton>
        </div>
      )}
    </ToolPageShell>
  );
}
