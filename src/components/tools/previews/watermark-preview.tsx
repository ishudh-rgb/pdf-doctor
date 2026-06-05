"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SignThumbScrollPanel } from "@/components/tools/sign-pdf/sign-thumb-scroll-panel";
import { WatermarkImageOverlay } from "@/components/tools/previews/watermark-image-overlay";
import { WatermarkTextOverlay } from "@/components/tools/previews/watermark-text-overlay";
import { WatermarkPageThumb } from "@/components/tools/previews/watermark-page-thumb";
import { PreviewStatGrid, ToolPreviewShell } from "@/components/tools/previews/tool-preview-shell";
import {
  loadPdfDocumentPreview,
  loadPdfThumbnailsBatched,
  pageThumbFromSession,
} from "@/lib/pdf/pdf-thumbnails.client";

const MAIN_PREVIEW_WIDTH = 520;
const THUMB_SIDEBAR_WIDTH = 72;

const PAGE_WIDTH_PT_PORTRAIT = 595;
const PAGE_WIDTH_PT_LANDSCAPE = 842;

function visualRotation(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function WatermarkPreview({
  file,
  watermarkType,
  text,
  opacity,
  fontSize,
  rotation,
  imagePreviewUrl,
  imageScale,
  onImageScaleChange,
  onRotationChange,
  onRemoveWatermarkImage,
  onFontSizeChange,
  onClearText,
  color,
  visiblePages,
  pageRotationDelta,
  currentDisplayIndex,
  onDocumentReady,
  onCurrentDisplayIndexChange,
  onRotatePage,
  onDeletePage,
  onPageActionError,
}: {
  file: File | null;
  watermarkType: "text" | "image";
  text: string;
  opacity: number;
  fontSize: number;
  rotation: number;
  imagePreviewUrl: string | null;
  imageScale: number;
  onImageScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onRemoveWatermarkImage: () => void;
  onFontSizeChange: (size: number) => void;
  onClearText: () => void;
  color: string;
  visiblePages: number[];
  pageRotationDelta: Record<number, number>;
  currentDisplayIndex: number;
  onDocumentReady: (totalPages: number) => void;
  onCurrentDisplayIndexChange: (index: number) => void;
  onRotatePage: (originalPageNum: number) => void;
  onDeletePage: (originalPageNum: number) => void;
  onPageActionError?: (message: string) => void;
}) {
  const [sessionId, setSessionId] = useState("");
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageLandscape, setPageLandscape] = useState<Record<number, boolean>>({});
  const [mainDisplayWidth, setMainDisplayWidth] = useState(0);
  const loadRef = useRef(0);
  const mainImgRef = useRef<HTMLImageElement>(null);

  const fileKey = file ? `${file.name}:${file.size}:${file.lastModified}` : "";

  const currentOriginalPage = visiblePages[currentDisplayIndex - 1] ?? visiblePages[0] ?? 1;
  const pageRotationVisual = visualRotation(pageRotationDelta[currentOriginalPage] ?? 0);

  useEffect(() => {
    if (!file) {
      setSessionId("");
      setThumbnails([]);
      setTotalPages(0);
      setPageLandscape({});
      setMainDisplayWidth(0);
      setLoadError(null);
      setLoading(false);
      return;
    }

    const requestId = ++loadRef.current;
    setLoading(true);
    setLoadError(null);
    setPageLandscape({});
    setSessionId("");
    setThumbnails([]);

    loadPdfDocumentPreview(file).then((preview) => {
      if (requestId !== loadRef.current) return;
      if (preview.error) setLoadError(preview.error);
      if (preview.sessionId) setSessionId(preview.sessionId);
      if (preview.totalPages > 0) setTotalPages(preview.totalPages);
    });

    loadPdfThumbnailsBatched(file, (thumbs, total) => {
      if (requestId !== loadRef.current) return;
      setThumbnails(thumbs);
      setTotalPages(total);
      onDocumentReady(total);
      setLoading(false);
    }).then((result) => {
      if (requestId !== loadRef.current) return;
      if (result.error) setLoadError(result.error);
      setLoading(false);
    });
  }, [fileKey, file, onDocumentReady]);

  useEffect(() => {
    if (visiblePages.length === 0) return;
    if (currentDisplayIndex > visiblePages.length) {
      onCurrentDisplayIndexChange(visiblePages.length);
    }
  }, [visiblePages.length, currentDisplayIndex, onCurrentDisplayIndexChange]);

  const mainThumbUrl =
    sessionId && currentOriginalPage > 0
      ? pageThumbFromSession(sessionId, currentOriginalPage, MAIN_PREVIEW_WIDTH)
      : thumbnails[currentOriginalPage - 1] ?? "";

  const isLandscape =
    pageRotationVisual === 90 || pageRotationVisual === 270
      ? !(pageLandscape[currentOriginalPage] ?? false)
      : (pageLandscape[currentOriginalPage] ?? false);

  const pageWidthPt = isLandscape ? PAGE_WIDTH_PT_LANDSCAPE : PAGE_WIDTH_PT_PORTRAIT;
  const watermarkFontPx =
    mainDisplayWidth > 0 ? Math.max(10, fontSize * (mainDisplayWidth / pageWidthPt)) : fontSize * 0.55;
  const imageWatermarkWidthPx = mainDisplayWidth > 0 ? mainDisplayWidth * imageScale : 120;

  const recordPageOrientation = useCallback((pageNum: number, naturalWidth: number, naturalHeight: number) => {
    setPageLandscape((prev) => ({
      ...prev,
      [pageNum]: naturalWidth > naturalHeight,
    }));
  }, []);

  const onMainImageLoad = useCallback(() => {
    const img = mainImgRef.current;
    if (!img) return;
    recordPageOrientation(currentOriginalPage, img.naturalWidth, img.naturalHeight);
    setMainDisplayWidth(img.clientWidth);
  }, [currentOriginalPage, recordPageOrientation]);

  useEffect(() => {
    const img = mainImgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      onMainImageLoad();
    }
  }, [mainThumbUrl, onMainImageLoad, pageRotationVisual]);

  const handleDelete = () => {
    if (visiblePages.length <= 1) {
      onPageActionError?.("Cannot delete the only remaining page.");
      return;
    }
    onDeletePage(currentOriginalPage);
  };

  if (!file) {
    return (
      <ToolPreviewShell stretch={false}>
        <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-pd-border bg-white/60 px-4 text-center text-sm text-pd-muted">
          Upload a PDF to preview watermark placement on each page
        </div>
      </ToolPreviewShell>
    );
  }

  return (
    <ToolPreviewShell
      stretch
      footer={
        <PreviewStatGrid
          items={[
            { label: "Opacity", value: `${Math.round(opacity * 100)}%` },
            {
              label: watermarkType === "image" ? "Image size" : "Font size",
              value:
                watermarkType === "text"
                  ? String(fontSize)
                  : `${Math.round(imageScale * 100)}%`,
            },
            { label: "Rotation", value: `${rotation}°` },
          ]}
        />
      }
    >
      <div className="flex min-h-0 flex-1 gap-2">
        <aside
          className="relative h-full min-h-0 shrink-0 overflow-hidden rounded-lg border border-pd-border bg-white"
          style={{ width: THUMB_SIDEBAR_WIDTH }}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin text-pd-brand" />
            </div>
          ) : (
            <SignThumbScrollPanel className="absolute inset-0">
              {visiblePages.map((originalPage, index) => {
                const displayIndex = index + 1;
                const active = displayIndex === currentDisplayIndex;
                const thumb = thumbnails[originalPage - 1] ?? "";
                const rotVisual = visualRotation(pageRotationDelta[originalPage] ?? 0);

                return (
                  <div key={originalPage} className="mb-2">
                    <WatermarkPageThumb
                      displayIndex={displayIndex}
                      thumb={thumb}
                      active={active}
                      landscape={pageLandscape[originalPage]}
                      rotationDeg={rotVisual}
                      onSelect={() => onCurrentDisplayIndexChange(displayIndex)}
                      onThumbLoad={(w, h) => recordPageOrientation(originalPage, w, h)}
                    />
                  </div>
                );
              })}
            </SignThumbScrollPanel>
          )}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-pd-border bg-[#e8eaed] p-3">
          {loadError && (
            <p className="mb-2 shrink-0 text-center text-xs text-red-600">{loadError}</p>
          )}

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto">
            {loading && !mainThumbUrl ? (
              <Loader2 className="h-7 w-7 animate-spin text-pd-brand" />
            ) : mainThumbUrl ? (
              <div
                className={cn(
                  "relative mx-auto w-full shadow-lg",
                  isLandscape ? "max-w-full" : "max-w-[min(100%,340px)]"
                )}
              >
                <div className="absolute right-2 top-2 z-20 flex items-center gap-0.5 rounded-lg bg-[#1f2937]/90 p-1 shadow-md">
                  <button
                    type="button"
                    onClick={() => onRotatePage(currentOriginalPage)}
                    className="rounded-md p-1.5 text-white transition hover:bg-white/15"
                    title="Rotate page left"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-md p-1.5 text-white transition hover:bg-red-500/80"
                    title="Delete page"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div
                  className="relative overflow-visible rounded-sm bg-white transition-transform duration-200"
                  style={pageRotationVisual ? { transform: `rotate(${pageRotationVisual}deg)` } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={mainImgRef}
                    key={`${mainThumbUrl}-${currentOriginalPage}`}
                    src={mainThumbUrl}
                    alt={`Page ${currentDisplayIndex} preview`}
                    className="block h-auto w-full"
                    onLoad={onMainImageLoad}
                  />
                  {watermarkType === "text" ? (
                    <WatermarkTextOverlay
                      text={text}
                      color={color}
                      opacity={opacity}
                      rotation={rotation}
                      fontSize={fontSize}
                      fontSizePx={watermarkFontPx}
                      onFontSizeChange={onFontSizeChange}
                      onRotationChange={onRotationChange}
                      onClear={onClearText}
                    />
                  ) : imagePreviewUrl ? (
                    <WatermarkImageOverlay
                      imageUrl={imagePreviewUrl}
                      opacity={opacity}
                      rotation={rotation}
                      scale={imageScale}
                      widthPx={imageWatermarkWidthPx}
                      onScaleChange={onImageScaleChange}
                      onRotationChange={onRotationChange}
                      onRemove={onRemoveWatermarkImage}
                    />
                  ) : (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Upload image to preview</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-pd-muted">Could not load page preview</p>
            )}
          </div>

          {!loading && visiblePages.length > 0 && (
            <p className="mt-2 shrink-0 text-center text-[11px] text-pd-muted">
              Page {currentDisplayIndex} of {visiblePages.length}
              {totalPages > 0 && visiblePages.length < totalPages
                ? ` (${totalPages - visiblePages.length} removed)`
                : ""}{" "}
              · Live preview updates as you edit
            </p>
          )}
        </div>
      </div>
    </ToolPreviewShell>
  );
}
