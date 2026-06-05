"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  Loader2,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils/file";
import { Button } from "@/components/ui/button";
import { loadPdfThumbnailsBatched } from "@/lib/pdf/pdf-thumbnails.client";
import { ToolErrorBanner } from "@/components/tools/tool-ui";
import { PdfPasswordModal } from "@/components/tools/pdf-password-modal";
import { DeletePageCard } from "@/components/tools/delete-pdf/delete-page-card";
import { PageInsertDivider } from "@/components/tools/split-pdf/page-insert-divider";
import { PageZoomModal } from "@/components/tools/split-pdf/page-zoom-modal";
import {
  createOriginalSlots,
  duplicateSlot,
  slotLabel,
  slotThumbUrl,
  type WorkspacePageSlot,
} from "@/components/tools/split-pdf/split-page-types";

interface DeletePdfWorkspaceProps {
  file: File;
  onChangeFile: () => void;
  onReset: () => void;
}

export function DeletePdfWorkspace({
  file,
  onChangeFile,
  onReset,
}: DeletePdfWorkspaceProps) {
  const [pageSlots, setPageSlots] = useState<WorkspacePageSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(
    () => new Set()
  );
  const [hiddenSlotIds, setHiddenSlotIds] = useState<Set<string>>(
    () => new Set()
  );
  const [zoomSlotId, setZoomSlotId] = useState<string | null>(null);
  const [rotations, setRotations] = useState<Record<string, number>>({});
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
    visibleSlots.length > 0 &&
    visibleSlots.every((s) => selectedSlotIds.has(s.id));

  const deletedCount = useMemo(
    () => hiddenSlotIds.size,
    [hiddenSlotIds]
  );

  /* ─── load thumbnails ─── */

  useEffect(() => {
    const requestId = ++loadRequestRef.current;
    setLoadingThumbs(true);
    setError(null);
    setThumbnails([]);
    setTotalPages(0);
    setHiddenSlotIds(new Set());
    setPageSlots([]);

    loadPdfThumbnailsBatched(file, (thumbs, total, trunc) => {
      if (requestId !== loadRequestRef.current) return;
      setThumbnails([...thumbs]);
      setTotalPages(total);
      setTruncated(trunc);
      if (total > 0) {
        const slots = createOriginalSlots(total);
        setPageSlots(slots);
        setSelectedSlotIds(new Set());
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
          setError(
            result.error ?? "Could not read this PDF. Try another file."
          );
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
          err instanceof Error
            ? err.message
            : "Could not read this PDF. Try another file."
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
        setSelectedSlotIds(new Set());
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

  /* ─── slot actions ─── */

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

  const removeSelected = useCallback(() => {
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

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedSlotIds(
        checked ? new Set(visibleSlots.map((s) => s.id)) : new Set()
      );
    },
    [visibleSlots]
  );

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
    },
    [pageSlots, hiddenSlotIds]
  );

  /* ─── insert pages ─── */

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
    },
    [hiddenSlotIds]
  );

  const openInsertDocuments = useCallback((visibleIndex: number) => {
    insertAfterIndexRef.current = visibleIndex;
    insertFileRef.current?.click();
  }, []);

  const handleInsertDocuments = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files?.[0];
      e.target.value = "";
      if (!picked) return;

      const formData = new FormData();
      formData.append("file", picked, picked.name || "document.pdf");

      try {
        const res = await fetch("/api/tools/pdf-session", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as {
          sessionId?: string;
          totalPages?: number;
          error?: string;
        };
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
          nextVisible.splice(
            insertAfterIndexRef.current + 1,
            0,
            ...newSlots
          );
          return [...nextVisible, ...hidden];
        });
      } catch {
        setError("Could not add document.");
      }
    },
    [hiddenSlotIds]
  );

  /* ─── export ─── */

  const handleExport = async () => {
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file, file.name || "document.pdf");

      const hasExtraSlots = visibleSlots.some(
        (s) => s.kind === "blank" || s.kind === "imported" || s.kind === "duplicate"
      );

      if (hasExtraSlots) {
        const composeSlots = visibleSlots.map((slot) => {
          if (slot.kind === "original")
            return { kind: "original" as const, page: slot.page };
          if (slot.kind === "blank") return { kind: "blank" as const };
          return {
            kind: "imported" as const,
            sessionId: (slot as { sessionId: string }).sessionId,
            page: slot.page,
          };
        });

        formData.append("slots", JSON.stringify(composeSlots));

        const res = await fetch("/api/tools/compose-pdf", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error || "Failed to export PDF."
          );
        }

        const blob = await res.blob();
        setResultUrl(URL.createObjectURL(blob));
        setCompleted(true);
        return;
      }

      const pagesToKeep = visibleSlots
        .filter((s) => s.kind === "original")
        .map((s) => s.page);

      formData.append("pagesToKeep", JSON.stringify(pagesToKeep));

      const res = await fetch("/api/tools/delete-pdf", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Failed to delete pages."
        );
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setCompleted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setProcessing(false);
    }
  };

  /* ─── completed view ─── */

  if (completed && resultUrl) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Check className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">PDF ready</h2>
        <p className="mt-2 text-sm text-gray-500">
          {deletedCount > 0
            ? `${deletedCount} page${deletedCount > 1 ? "s" : ""} removed. Your document is ready to download.`
            : "Your document is ready to download."}
        </p>
        <a
          href={resultUrl}
          download={file.name.replace(/\.pdf$/i, "-pages-removed.pdf")}
          className="mt-5 inline-block"
        >
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
          className="mx-auto mt-3 block text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          Delete pages from another file
        </button>
      </div>
    );
  }

  /* ─── main UI ─── */

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

      {zoomSlotId !== null &&
        (() => {
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
              onRotateLeft={() =>
                setRotations((prev) => ({ ...prev, [slot.id]: ((prev[slot.id] ?? 0) - 90 + 360) % 360 }))
              }
              onRotateRight={() =>
                setRotations((prev) => ({ ...prev, [slot.id]: ((prev[slot.id] ?? 0) + 90) % 360 }))
              }
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={allPagesSelected}
              onChange={(e) => toggleSelectAll(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
            />
            <span className="font-medium text-gray-700">Select all</span>
          </label>

          <div className="hidden h-6 w-px bg-gray-200 sm:block" />

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={removeSelected}
              disabled={selectedVisibleCount === 0}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-35"
              title="Delete selected pages"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete selected</span>
            </button>

            <div className="mx-1 hidden h-5 w-px bg-gray-200 sm:block" />

            <button
              type="button"
              onClick={() => {
                const toRotate = visibleSlots.filter((s) => selectedSlotIds.has(s.id));
                void toRotate;
              }}
              disabled={true}
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 sm:flex"
              title="Rotate left"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {}}
              disabled={true}
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 sm:flex"
              title="Rotate right"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          {selectedVisibleCount > 0 && (
            <span className="text-sm text-gray-400">
              {selectedVisibleCount} of {visibleSlots.length} selected
            </span>
          )}

          {deletedCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              {deletedCount} page{deletedCount > 1 ? "s" : ""} removed
            </span>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 lg:inline">
              {file.name}
              <span className="ml-1.5 text-gray-400">
                {totalPages} pages · {formatFileSize(file.size)}
              </span>
            </span>

            <button
              type="button"
              onClick={onChangeFile}
              className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:inline"
            >
              Change file
            </button>

            <Button
              size="sm"
              onClick={handleExport}
              disabled={processing || loadingThumbs || visibleSlots.length === 0}
              className="gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="px-4 pt-3 sm:px-5">
            <ToolErrorBanner message={error} />
          </div>
        )}

        {/* ── Page grid ── */}
        <div className="bg-gray-100 px-4 py-5 sm:px-6 sm:py-6">
          {loadingThumbs && !thumbnails.some(Boolean) && (
            <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Generating page previews…
            </div>
          )}

          {totalPages > 0 && (
            <>
              {truncated && (
                <p className="mb-3 text-center text-xs text-gray-400">
                  Showing first {thumbnails.length} of {totalPages} page
                  previews.
                </p>
              )}
              <p className="mb-4 text-center text-sm text-gray-400">
                Click the <strong className="text-red-500">trash icon</strong>{" "}
                to delete a page · Click{" "}
                <strong className="text-blue-600">+</strong> between pages to
                add documents
              </p>

              <div className="flex flex-wrap items-start justify-center gap-x-0 gap-y-4 sm:gap-x-0">
                {visibleSlots.map((slot, index) => (
                  <div key={slot.id} className="flex items-center">
                    <DeletePageCard
                      pageNum={index + 1}
                      fileName={slotLabel(slot, file.name)}
                      thumb={slotThumbUrl(slot, thumbnails)}
                      loadingThumb={
                        loadingThumbs && !slotThumbUrl(slot, thumbnails)
                      }
                      isBlank={slot.kind === "blank"}
                      selected={selectedSlotIds.has(slot.id)}
                      rotation={rotations[slot.id] ?? 0}
                      onSelect={() => toggleSlot(slot.id)}
                      onZoom={() => setZoomSlotId(slot.id)}
                      onDelete={() => removeSlot(slot.id)}
                      onDuplicate={() => duplicateSlotAfter(slot.id)}
                      onRotateLeft={() =>
                        setRotations((prev) => ({ ...prev, [slot.id]: ((prev[slot.id] ?? 0) - 90 + 360) % 360 }))
                      }
                      onRotateRight={() =>
                        setRotations((prev) => ({ ...prev, [slot.id]: ((prev[slot.id] ?? 0) + 90) % 360 }))
                      }
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

        <div className="border-t border-gray-200 bg-white px-4 py-2.5 text-center text-xs text-gray-400 sm:px-5">
          Deleted pages are removed on export · Files auto-delete after 2 hours
        </div>
      </div>
    </>
  );
}
