"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  Loader2,
  RotateCcw,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/file";
import { Button } from "@/components/ui/button";
import { loadPdfThumbnailsBatched } from "@/lib/pdf/pdf-thumbnails.client";
import { ToolErrorBanner } from "@/components/tools/tool-ui";
import { PageInsertDivider } from "@/components/tools/split-pdf/page-insert-divider";
import { SplitPageCard } from "@/components/tools/split-pdf/split-page-card";
import { PdfPasswordModal } from "@/components/tools/pdf-password-modal";
import { PageZoomModal } from "@/components/tools/split-pdf/page-zoom-modal";
import {
  createOriginalSlots,
  duplicateSlot,
  slotLabel,
  slotThumbUrl,
  type WorkspacePageSlot,
} from "@/components/tools/split-pdf/split-page-types";

interface RotatePdfWorkspaceProps {
  file: File;
  onChangeFile: () => void;
  onReset: () => void;
}

export function RotatePdfWorkspace({ file, onChangeFile, onReset }: RotatePdfWorkspaceProps) {
  const [pageSlots, setPageSlots] = useState<WorkspacePageSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(() => new Set());
  const [hiddenSlotIds, setHiddenSlotIds] = useState<Set<string>>(() => new Set());
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const [zoomSlotId, setZoomSlotId] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [loadingThumbs, setLoadingThumbs] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<{
    file: File;
    fileName: string;
    errorMsg?: string;
    loading?: boolean;
  } | null>(null);
  const loadRequestRef = useRef(0);
  const insertFileRef = useRef<HTMLInputElement>(null);
  const insertAfterIndexRef = useRef(0);

  const fileKey = `${file.name}:${file.size}:${file.lastModified}`;

  const visibleSlots = useMemo(
    () => pageSlots.filter((s) => !hiddenSlotIds.has(s.id)),
    [pageSlots, hiddenSlotIds]
  );

  const selectedVisibleCount = useMemo(
    () => visibleSlots.filter((s) => selectedSlotIds.has(s.id)).length,
    [visibleSlots, selectedSlotIds]
  );

  const allPagesSelected =
    visibleSlots.length > 0 && visibleSlots.every((s) => selectedSlotIds.has(s.id));
  const somePagesSelected = selectedVisibleCount > 0 && !allPagesSelected;

  const rotatedCount = useMemo(
    () => visibleSlots.filter((s) => (rotations[s.id] ?? 0) !== 0).length,
    [visibleSlots, rotations]
  );

  useEffect(() => {
    const requestId = ++loadRequestRef.current;
    setLoadingThumbs(true);
    setError(null);
    setThumbnails([]);
    setTotalPages(0);
    setHiddenSlotIds(new Set());
    setPageSlots([]);
    setRotations({});
    setSelectedSlotIds(new Set());

    loadPdfThumbnailsBatched(file, (thumbs, total, trunc) => {
      if (requestId !== loadRequestRef.current) return;
      setThumbnails([...thumbs]);
      setTotalPages(total);
      setTruncated(trunc);
      if (total > 0) {
        const slots = createOriginalSlots(total);
        setPageSlots(slots);
        setSelectedSlotIds(new Set(slots.map((s) => s.id)));
        setError(null);
      }
    })
      .then((result) => {
        if (requestId !== loadRequestRef.current) return;
        if (result.passwordRequired) {
          setPasswordPrompt({ file, fileName: file.name });
          return;
        }
        if (result.wrongPassword) {
          setPasswordPrompt((prev) => prev ? { ...prev, errorMsg: result.error ?? "Incorrect password.", loading: false } : prev);
          return;
        }
        if (result.totalPages === 0) {
          setError(result.error ?? "Could not read this PDF. Try another file.");
        } else if (result.error) {
          setError(result.error);
        } else {
          setError(null);
        }
      })
      .catch((err) => {
        if (requestId !== loadRequestRef.current) return;
        setThumbnails([]);
        setTotalPages(0);
        setError(
          err instanceof Error ? err.message : "Could not read this PDF. Try another file."
        );
      })
      .finally(() => {
        if (requestId === loadRequestRef.current) setLoadingThumbs(false);
      });
  }, [fileKey, file]);

  const retryWithPassword = useCallback((pw: string) => {
    if (!passwordPrompt) return;
    const { file } = passwordPrompt;
    setPasswordPrompt((prev) => prev ? { ...prev, loading: true, errorMsg: undefined } : prev);

    loadPdfThumbnailsBatched(file, (thumbs, total, trunc) => {
      setThumbnails([...thumbs]);
      setTotalPages(total);
      setTruncated(trunc);
      if (total > 0) {
        const slots = createOriginalSlots(total);
        setPageSlots(slots);
        setSelectedSlotIds(new Set(slots.map((s) => s.id)));
        setError(null);
      }
    }, pw).then((result) => {
      if (result.wrongPassword) {
        setPasswordPrompt((prev) => prev ? { ...prev, errorMsg: result.error ?? "Incorrect password.", loading: false } : prev);
        return;
      }
      setPasswordPrompt(null);
      if (result.error) setError(result.error);
    });
  }, [passwordPrompt]);

  const rotateSlot = useCallback((slotId: string, delta: number) => {
    setRotations((prev) => ({
      ...prev,
      [slotId]: ((prev[slotId] ?? 0) + delta + 360) % 360,
    }));
  }, []);

  const rotateSelected = useCallback(
    (delta: number) => {
      setRotations((prev) => {
        const next = { ...prev };
        for (const slot of visibleSlots) {
          if (selectedSlotIds.has(slot.id)) {
            next[slot.id] = ((next[slot.id] ?? 0) + delta + 360) % 360;
          }
        }
        return next;
      });
    },
    [visibleSlots, selectedSlotIds]
  );

  const removeSlot = useCallback(
    (slotId: string) => {
      setHiddenSlotIds((prev) => new Set(prev).add(slotId));
      setSelectedSlotIds((prev) => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
    },
    []
  );

  const removeSelectedPages = useCallback(() => {
    const toRemove = visibleSlots.filter((s) => selectedSlotIds.has(s.id));
    for (const slot of toRemove) removeSlot(slot.id);
  }, [visibleSlots, selectedSlotIds, removeSlot]);

  const toggleSlot = useCallback((slotId: string) => {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }, []);

  const duplicateSlotAfter = useCallback(
    (slotId: string) => {
      const visible = pageSlots.filter((s) => !hiddenSlotIds.has(s.id));
      const slot = visible.find((s) => s.id === slotId);
      if (!slot) return;

      const copy = duplicateSlot(slot);
      const index = visible.findIndex((s) => s.id === slotId);
      if (index < 0) return;

      setPageSlots((prev) => {
        const vis = prev.filter((s) => !hiddenSlotIds.has(s.id));
        const hidden = prev.filter((s) => hiddenSlotIds.has(s.id));
        const nextVisible = [...vis];
        nextVisible.splice(index + 1, 0, copy);
        return [...nextVisible, ...hidden];
      });
      setRotations((prev) => ({ ...prev, [copy.id]: prev[slotId] ?? 0 }));
      setSelectedSlotIds((prev) => new Set(prev).add(copy.id));
    },
    [pageSlots, hiddenSlotIds]
  );

  const insertBlankAfter = useCallback(
    (visibleIndex: number) => {
      const newSlot: WorkspacePageSlot = {
        id: `blank-${crypto.randomUUID()}`,
        kind: "blank",
      };
      setPageSlots((prev) => {
        const visible = prev.filter((s) => !hiddenSlotIds.has(s.id));
        const hidden = prev.filter((s) => hiddenSlotIds.has(s.id));
        const nextVisible = [...visible];
        nextVisible.splice(visibleIndex + 1, 0, newSlot);
        return [...nextVisible, ...hidden];
      });
      setSelectedSlotIds((prev) => new Set(prev).add(newSlot.id));
    },
    [hiddenSlotIds]
  );

  const openInsertDocuments = useCallback((visibleIndex: number) => {
    insertAfterIndexRef.current = visibleIndex;
    insertFileRef.current?.click();
  }, []);

  const handleInsertDocuments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;

    const formData = new FormData();
    formData.append("file", picked, picked.name || "document.pdf");

    try {
      const res = await fetch("/api/tools/pdf-session", { method: "POST", body: formData });
      const data = (await res.json()) as { sessionId?: string; totalPages?: number; error?: string };
      if (!res.ok || !data.sessionId || !data.totalPages) {
        setError(data.error ?? "Could not add document.");
        return;
      }

      const sessionId = data.sessionId;
      const newSlots: WorkspacePageSlot[] = Array.from(
        { length: data.totalPages },
        (_, i) => ({
          id: `imp-${crypto.randomUUID()}`,
          kind: "imported" as const,
          page: i + 1,
          fileName: picked.name,
          sessionId,
        })
      );

      setPageSlots((prev) => {
        const visible = prev.filter((s) => !hiddenSlotIds.has(s.id));
        const hidden = prev.filter((s) => hiddenSlotIds.has(s.id));
        const nextVisible = [...visible];
        nextVisible.splice(insertAfterIndexRef.current + 1, 0, ...newSlots);
        return [...nextVisible, ...hidden];
      });
      setSelectedSlotIds((prev) => {
        const next = new Set(prev);
        newSlots.forEach((s) => next.add(s.id));
        return next;
      });
    } catch {
      setError("Could not add document.");
    }
  };

  const handleApplyAndDownload = async () => {
    setProcessing(true);
    setError(null);

    try {
      const rotationsMap: Record<number, number> = {};
      for (const slot of visibleSlots) {
        const deg = rotations[slot.id] ?? 0;
        if (deg !== 0 && slot.kind === "original") {
          rotationsMap[slot.page] = deg;
        }
      }

      if (Object.keys(rotationsMap).length === 0) {
        throw new Error("No rotations applied. Rotate at least one page before downloading.");
      }

      const formData = new FormData();
      formData.append("file", file, file.name || "document.pdf");
      formData.append("rotations", JSON.stringify(rotationsMap));

      const res = await fetch("/api/tools/rotate-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to rotate PDF. Please try again.");
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  if (completed && resultUrl) {
    return (
      <div className="rounded-xl border border-pd-border bg-pd-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pd-brand-muted">
          <Check className="h-7 w-7 text-pd-brand" />
        </div>
        <h2 className="text-lg font-bold text-pd-foreground">PDF ready</h2>
        <p className="mt-2 text-sm text-pd-muted">
          Your rotated document is ready to download.
        </p>
        <a href={resultUrl} download={`rotated-${file.name}`} className="mt-5 inline-block">
          <Button size="md" className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </a>
        <button
          type="button"
          onClick={() => {
            setCompleted(false);
            setResultUrl(null);
            onReset();
          }}
          className="mx-auto mt-3 block text-sm text-pd-muted hover:text-pd-foreground"
        >
          Rotate another file
        </button>
      </div>
    );
  }

  return (
    <>
      {passwordPrompt && (
        <PdfPasswordModal
          fileName={passwordPrompt.fileName}
          errorMessage={passwordPrompt.errorMsg}
          loading={passwordPrompt.loading}
          onSubmit={retryWithPassword}
          onCancel={() => {
            setPasswordPrompt(null);
            onReset();
          }}
        />
      )}

      <input
        ref={insertFileRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleInsertDocuments}
      />

      {zoomSlotId !== null && (() => {
        const slot = visibleSlots.find((s) => s.id === zoomSlotId);
        if (!slot) return null;
        const idx = visibleSlots.indexOf(slot);
        return (
          <PageZoomModal
            pageNum={idx + 1}
            totalPages={visibleSlots.length}
            imageUrl={slotThumbUrl(slot, thumbnails)}
            rotation={rotations[slot.id] ?? 0}
            thumbnails={visibleSlots.map((s) => slotThumbUrl(s, thumbnails) ?? "")}
            onClose={() => setZoomSlotId(null)}
            onNavigate={(n) => {
              const target = visibleSlots[n - 1];
              if (target) setZoomSlotId(target.id);
            }}
            onRotateLeft={() => rotateSlot(zoomSlotId, -90)}
            onRotateRight={() => rotateSlot(zoomSlotId, 90)}
            onDelete={() => {
              removeSlot(zoomSlotId);
              const remaining = visibleSlots.filter((s) => s.id !== zoomSlotId);
              if (remaining.length === 0) {
                setZoomSlotId(null);
                return;
              }
              const nextIdx = Math.min(idx, remaining.length - 1);
              setZoomSlotId(remaining[nextIdx].id);
            }}
          />
        );
      })()}

      <div className="overflow-hidden rounded-xl border border-pd-border bg-pd-surface shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-pd-border bg-pd-background px-3 py-2.5 sm:px-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs sm:text-sm">
            <input
              type="checkbox"
              checked={allPagesSelected}
              ref={(el) => {
                if (el) el.indeterminate = somePagesSelected;
              }}
              onChange={(e) =>
                setSelectedSlotIds(
                  e.target.checked ? new Set(visibleSlots.map((s) => s.id)) : new Set()
                )
              }
              className="accent-pd-brand"
            />
            <span className="font-medium text-pd-foreground">Select all</span>
          </label>

          <div className="flex items-center gap-0.5 rounded-lg border border-pd-border bg-pd-surface p-0.5">
            <button
              type="button"
              onClick={() => rotateSelected(-90)}
              disabled={selectedVisibleCount === 0}
              className="rounded p-1.5 text-pd-muted hover:bg-pd-background hover:text-pd-foreground disabled:opacity-40"
              title="Rotate selected left"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => rotateSelected(90)}
              disabled={selectedVisibleCount === 0}
              className="rounded p-1.5 text-pd-muted hover:bg-pd-background hover:text-pd-foreground disabled:opacity-40"
              title="Rotate selected right"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={removeSelectedPages}
              disabled={selectedVisibleCount === 0}
              className="rounded p-1.5 text-pd-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              title="Remove selected pages"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <span className="hidden text-xs text-pd-muted sm:inline">
            {selectedVisibleCount} of {visibleSlots.length} selected
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onChangeFile}
              className="hidden text-xs text-pd-muted hover:text-pd-brand sm:inline"
            >
              Change file
            </button>
            <Button
              size="sm"
              onClick={handleApplyAndDownload}
              disabled={processing || loadingThumbs || rotatedCount === 0}
              className="gap-1.5"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Apply &amp; Download
                </>
              )}
            </Button>
          </div>
        </div>

        {/* File info bar */}
        <div className="flex items-center justify-between gap-2 border-b border-pd-border bg-pd-brand-muted/40 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <RotateCw className="h-4 w-4 shrink-0 text-pd-brand" />
            <p className="truncate text-sm font-medium text-pd-foreground">{file.name}</p>
            <span className="shrink-0 text-xs text-pd-muted">
              {totalPages} pages · {formatFileSize(file.size)}
            </span>
          </div>
          <button
            type="button"
            onClick={onChangeFile}
            className="shrink-0 text-pd-muted hover:text-pd-foreground sm:hidden"
            aria-label="Change file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="px-3 pt-3 sm:px-4">
            <ToolErrorBanner message={error} />
          </div>
        )}

        {/* Page grid */}
        <div className="bg-[#e8eef5] px-3 py-4 sm:px-4 sm:py-5">
          {loadingThumbs && !thumbnails.some(Boolean) && (
            <div className="mb-3 flex items-center justify-center gap-2 text-sm text-pd-muted">
              <Loader2 className="h-4 w-4 animate-spin text-pd-brand" />
              Generating page previews…
            </div>
          )}
          {totalPages > 0 && (
            <>
              {truncated && (
                <p className="mb-3 text-center text-xs text-pd-muted">
                  Showing first {thumbnails.length} of {totalPages} page previews.
                </p>
              )}
              <p className="mb-3 text-center text-xs text-pd-muted">
                Click pages to select · Hover for rotate controls · <strong>Apply &amp; Download</strong> when done
              </p>
              <div className="flex flex-wrap items-start justify-center gap-x-0 gap-y-3 sm:gap-x-0">
                {visibleSlots.map((slot, index) => (
                  <div key={slot.id} className="flex items-center">
                    <SplitPageCard
                      pageNum={index + 1}
                      fileName={slotLabel(slot, file.name)}
                      thumb={slotThumbUrl(slot, thumbnails)}
                      loadingThumb={loadingThumbs && !slotThumbUrl(slot, thumbnails)}
                      isBlank={slot.kind === "blank"}
                      rotation={rotations[slot.id] ?? 0}
                      mode="extract"
                      selected={selectedSlotIds.has(slot.id)}
                      onSelect={() => toggleSlot(slot.id)}
                      onZoom={() => setZoomSlotId(slot.id)}
                      onRotateLeft={() => rotateSlot(slot.id, -90)}
                      onDuplicate={() => duplicateSlotAfter(slot.id)}
                      onRemove={() => removeSlot(slot.id)}
                    />
                    {index < visibleSlots.length - 1 && (
                      <PageInsertDivider
                        onAddBlank={() => insertBlankAfter(index)}
                        onAddDocuments={() => openInsertDocuments(index)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-pd-border px-3 py-2 text-center text-[11px] text-pd-muted sm:px-4">
          {rotatedCount > 0
            ? `${rotatedCount} page${rotatedCount !== 1 ? "s" : ""} rotated · `
            : ""}
          Files auto-delete after 2 hours
        </div>
      </div>
    </>
  );
}
