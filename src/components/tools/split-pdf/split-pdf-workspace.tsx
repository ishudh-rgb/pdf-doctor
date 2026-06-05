"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Plus,
  Scissors,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/file";
import { Button } from "@/components/ui/button";
import {
  loadPdfThumbnailsBatched,
  rangesFromSplitAfter,
  rangesToFormString,
  splitAfterFromEachPage,
  splitAfterFromEveryN,
} from "@/lib/pdf/pdf-thumbnails.client";
import { ToolErrorBanner } from "@/components/tools/tool-ui";
import { PdfPasswordModal } from "@/components/tools/pdf-password-modal";
import { ExtractToolbar } from "@/components/tools/split-pdf/extract-toolbar";
import { PageInsertDivider } from "@/components/tools/split-pdf/page-insert-divider";
import { SplitDivider } from "@/components/tools/split-pdf/split-divider";
import { SplitPageCard } from "@/components/tools/split-pdf/split-page-card";
import { PageZoomModal } from "@/components/tools/split-pdf/page-zoom-modal";
import {
  createOriginalSlots,
  duplicateSlot,
  slotLabel,
  slotThumbUrl,
  type WorkspacePageSlot,
} from "@/components/tools/split-pdf/split-page-types";

type WorkspaceTab = "split" | "extract";

interface SplitPdfWorkspaceProps {
  file: File;
  onChangeFile: () => void;
  onReset: () => void;
}

export function SplitPdfWorkspace({ file, onChangeFile, onReset }: SplitPdfWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("split");
  const [separatePdfs, setSeparatePdfs] = useState(false);
  const [autoEvery, setAutoEvery] = useState(false);
  const [everyN, setEveryN] = useState(1);
  const [splitAfter, setSplitAfter] = useState<Set<number>>(() => new Set());
  const [manualSplits, setManualSplits] = useState(false);
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
  const [resultFilename, setResultFilename] = useState<string | null>(null);
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

  const splitVisibleSlots = useMemo(
    () =>
      visibleSlots.filter(
        (s): s is WorkspacePageSlot & { kind: "original" } => s.kind === "original"
      ),
    [visibleSlots]
  );

  const originalVisiblePages = useMemo(
    () => splitVisibleSlots.map((s) => s.page),
    [splitVisibleSlots]
  );

  const isDefaultSplitLayout = useMemo(
    () =>
      hiddenSlotIds.size === 0 &&
      splitVisibleSlots.length === totalPages &&
      splitVisibleSlots.every((s, i) => s.page === i + 1),
    [hiddenSlotIds.size, splitVisibleSlots, totalPages]
  );

  const splitCutPositions = useMemo(
    () => new Set([...splitAfter].map((i) => i + 1)),
    [splitAfter]
  );

  const applyAutoSplits = useCallback(
    (pages: number, every: number, useEach: boolean) => {
      const oneBased =
        useEach && every <= 1
          ? splitAfterFromEachPage(pages)
          : splitAfterFromEveryN(pages, every);
      setSplitAfter(new Set([...oneBased].map((p) => p - 1)));
    },
    []
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

    loadPdfThumbnailsBatched(file, (thumbs, total, trunc) => {
        if (requestId !== loadRequestRef.current) return;
        setThumbnails([...thumbs]);
        setTotalPages(total);
        setTruncated(trunc);
        if (total > 0) {
          const slots = createOriginalSlots(total);
          setPageSlots(slots);
          setSelectedSlotIds(new Set(slots.map((s) => s.id)));
          setSplitAfter(new Set());
          setManualSplits(false);
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
        setSplitAfter(new Set());
        setManualSplits(false);
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

  useEffect(() => {
    if (manualSplits || tab !== "split" || splitVisibleSlots.length === 0) return;
    if (autoEvery) {
      applyAutoSplits(splitVisibleSlots.length, everyN, everyN <= 1);
    } else {
      setSplitAfter(new Set());
    }
  }, [autoEvery, everyN, splitVisibleSlots.length, manualSplits, tab, applyAutoSplits]);

  const selectedVisibleCount = useMemo(
    () => visibleSlots.filter((s) => selectedSlotIds.has(s.id)).length,
    [visibleSlots, selectedSlotIds]
  );

  const allPagesSelected =
    visibleSlots.length > 0 && visibleSlots.every((s) => selectedSlotIds.has(s.id));
  const somePagesSelected = selectedVisibleCount > 0 && !allPagesSelected;

  const outputPdfCount = useMemo(() => {
    if (tab === "extract") {
      if (selectedVisibleCount === 0) return 0;
      return separatePdfs ? selectedVisibleCount : 1;
    }
    return rangesFromSplitAfter(splitVisibleSlots.length, splitCutPositions).length;
  }, [tab, selectedVisibleCount, separatePdfs, splitVisibleSlots.length, splitCutPositions]);

  const toggleSplitAfter = (afterSlotIndex: number) => {
    setManualSplits(true);
    setSplitAfter((prev) => {
      const next = new Set(prev);
      if (next.has(afterSlotIndex)) next.delete(afterSlotIndex);
      else next.add(afterSlotIndex);
      return next;
    });
  };

  const rotateSlot = (slotId: string, delta: number) => {
    setRotations((prev) => ({
      ...prev,
      [slotId]: ((prev[slotId] ?? 0) + delta + 360) % 360,
    }));
  };

  const removeSlot = (slotId: string) => {
    const slot = pageSlots.find((s) => s.id === slotId);
    const visible = pageSlots.filter((s) => !hiddenSlotIds.has(s.id));
    const removedIndex = visible.findIndex((s) => s.id === slotId);

    setHiddenSlotIds((prev) => new Set(prev).add(slotId));
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      next.delete(slotId);
      return next;
    });

    if (removedIndex >= 0) {
      setSplitAfter((prev) => {
        const next = new Set<number>();
        for (const idx of prev) {
          if (idx < removedIndex) next.add(idx);
          else if (idx > removedIndex) next.add(idx - 1);
        }
        return next;
      });
    }
  };

  const toggleSlot = (slotId: string) => {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  const rotateSelected = (delta: number) => {
    setRotations((prev) => {
      const next = { ...prev };
      for (const slot of visibleSlots) {
        if (selectedSlotIds.has(slot.id)) {
          next[slot.id] = ((next[slot.id] ?? 0) + delta + 360) % 360;
        }
      }
      return next;
    });
  };

  const removeSelectedPages = () => {
    const toRemove = visibleSlots.filter((s) => selectedSlotIds.has(s.id));
    for (const slot of toRemove) removeSlot(slot.id);
  };

  const duplicateSlotAfter = (slotId: string) => {
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
  };

  const duplicateSelected = () => {
    const pairs: { index: number; sourceId: string; copy: WorkspacePageSlot }[] = [];
    visibleSlots.forEach((s, i) => {
      if (selectedSlotIds.has(s.id)) {
        pairs.push({ index: i, sourceId: s.id, copy: duplicateSlot(s) });
      }
    });
    if (pairs.length === 0) return;
    pairs.sort((a, b) => b.index - a.index);

    setPageSlots((prev) => {
      const vis = prev.filter((s) => !hiddenSlotIds.has(s.id));
      const hidden = prev.filter((s) => hiddenSlotIds.has(s.id));
      const nextVisible = [...vis];
      for (const { index, copy } of pairs) {
        nextVisible.splice(index + 1, 0, copy);
      }
      return [...nextVisible, ...hidden];
    });
    setRotations((prev) => {
      const next = { ...prev };
      for (const { sourceId, copy } of pairs) {
        next[copy.id] = prev[sourceId] ?? 0;
      }
      return next;
    });
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      pairs.forEach((p) => next.add(p.copy.id));
      return next;
    });
  };

  const insertBlankAfter = (visibleIndex: number) => {
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
  };

  const openInsertDocuments = (visibleIndex: number) => {
    insertAfterIndexRef.current = visibleIndex;
    insertFileRef.current?.click();
  };

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

  const handleFinish = async () => {
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file, file.name || "document.pdf");

      if (tab === "extract") {
        const selected = visibleSlots.filter((s) => selectedSlotIds.has(s.id));
        if (selected.length === 0) throw new Error("Select at least one page to extract.");

        const composeSlots = selected.map((slot) => {
          if (slot.kind === "original") return { kind: "original" as const, page: slot.page };
          if (slot.kind === "blank") return { kind: "blank" as const };
          return {
            kind: "imported" as const,
            sessionId: slot.sessionId,
            page: slot.page,
          };
        });

        formData.append("slots", JSON.stringify(composeSlots));
        formData.append("separate", String(separatePdfs));

        const res = await fetch("/api/tools/compose-pdf", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to extract PDF. Please try again.");
        }

        const contentType = res.headers.get("content-type") || "";
        const isZip = contentType.includes("application/zip");
        const blob = await res.blob();
        setResultUrl(URL.createObjectURL(blob));
        setResultFilename(isZip ? "extracted-pages.zip" : "extracted.pdf");
        setCompleted(true);
        return;
      }

      const splitSlots = splitVisibleSlots;
      const ranges = rangesFromSplitAfter(splitSlots.length, splitCutPositions);

      if (!isDefaultSplitLayout) {
        if (splitSlots.length === 0) throw new Error("No pages left to export.");
        const composeSlots = splitSlots.map((s) => ({
          kind: "original" as const,
          page: s.page,
        }));
        formData.append("slots", JSON.stringify(composeSlots));
        formData.append("splitRanges", rangesToFormString(ranges));

        const res = await fetch("/api/tools/compose-pdf", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to split PDF. Please try again.");
        }
        const blob = await res.blob();
        setResultUrl(URL.createObjectURL(blob));
        setResultFilename("split-pages.zip");
        setCompleted(true);
        return;
      }

      const includedPages = originalVisiblePages;

      if (hiddenSlotIds.size > 0) {
        if (includedPages.length === 0) throw new Error("No pages left to export.");
        formData.append("mode", "extract");
        formData.append("pages", includedPages.join(","));
      } else if (ranges.length === 1 && ranges[0].start === 1 && ranges[0].end === totalPages) {
        formData.append("mode", "extract");
        formData.append("pages", `1-${totalPages}`);
      } else if (
        splitAfter.size === totalPages - 1 &&
        everyN <= 1 &&
        autoEvery
      ) {
        formData.append("mode", "all");
      } else {
        formData.append("mode", "range");
        formData.append("ranges", rangesToFormString(ranges));
      }

      const res = await fetch("/api/tools/split-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to split PDF. Please try again.");
      }

      const contentType = res.headers.get("content-type") || "";
      const isZip = contentType.includes("application/zip");
      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename(isZip ? "split-pages.zip" : "split.pdf");
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  const finishLabel =
    tab === "extract"
      ? separatePdfs
        ? `Finish (${selectedVisibleCount} PDFs)`
        : "Finish"
      : outputPdfCount > 1
        ? `Split (${outputPdfCount} PDFs)`
        : "Split PDF";

  if (completed && resultUrl) {
    return (
      <div className="rounded-xl border border-pd-border bg-pd-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pd-brand-muted">
          <Check className="h-7 w-7 text-pd-brand" />
        </div>
        <h2 className="text-lg font-bold text-pd-foreground">PDF ready</h2>
        <p className="mt-2 text-sm text-pd-muted">
          {resultFilename?.endsWith(".zip")
            ? "Each part is in a ZIP file."
            : "Your document is ready to download."}
        </p>
        <a href={resultUrl} download={resultFilename || "split.pdf"} className="mt-5 inline-block">
          <Button size="md">Download</Button>
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
          Split another file
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
        <div className="flex flex-wrap items-center gap-3 border-b border-pd-border bg-pd-background px-3 py-2.5 sm:px-4">
          <div className="flex rounded-lg border border-pd-border bg-pd-surface p-0.5">
            <button
              type="button"
              onClick={() => setTab("split")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                tab === "split" ? "bg-pd-brand text-white" : "text-pd-muted hover:text-pd-foreground"
              )}
            >
              <Scissors className="h-3.5 w-3.5" />
              Split
            </button>
            <button
              type="button"
              onClick={() => setTab("extract")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                tab === "extract" ? "bg-pd-brand text-white" : "text-pd-muted hover:text-pd-foreground"
              )}
            >
              Extract
            </button>
          </div>

          <div className="hidden h-6 w-px bg-pd-border sm:block" />

          {tab === "split" ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={autoEvery}
                onChange={(e) => {
                  setManualSplits(false);
                  setAutoEvery(e.target.checked);
                }}
                className="accent-pd-brand"
              />
              <span className="text-pd-foreground">Split after every</span>
              <div className="flex items-center rounded-md border border-pd-border bg-pd-surface">
                <button
                  type="button"
                  onClick={() => {
                    setManualSplits(false);
                    setEveryN((n) => Math.max(1, n - 1));
                  }}
                  className="px-2 py-1 text-pd-muted hover:text-pd-foreground"
                  aria-label="Decrease"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-semibold">{everyN}</span>
                <button
                  type="button"
                  onClick={() => {
                    setManualSplits(false);
                    setEveryN((n) => Math.min(totalPages || 1, n + 1));
                  }}
                  className="px-2 py-1 text-pd-muted hover:text-pd-foreground"
                  aria-label="Increase"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-pd-muted">pages</span>
            </label>
          ) : (
            <ExtractToolbar
              selectedCount={selectedVisibleCount}
              totalCount={visibleSlots.length}
              allSelected={allPagesSelected}
              someSelected={somePagesSelected}
              separatePdfs={separatePdfs}
              processing={processing}
              disabled={loadingThumbs}
              onSelectAll={(checked) =>
                setSelectedSlotIds(
                  checked ? new Set(visibleSlots.map((s) => s.id)) : new Set()
                )
              }
              onRotateLeft={() => rotateSelected(-90)}
              onDuplicateSelected={duplicateSelected}
              onDeleteSelected={removeSelectedPages}
              onSeparatePdfsChange={setSeparatePdfs}
              onFinish={handleFinish}
            />
          )}

          {tab === "split" && (
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
                onClick={handleFinish}
                disabled={processing || loadingThumbs || outputPdfCount === 0}
                className="gap-1.5"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    {finishLabel}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {tab === "extract" && (
            <button
              type="button"
              onClick={onChangeFile}
              className="ml-auto hidden text-xs text-pd-muted hover:text-pd-brand sm:ml-0 lg:inline"
            >
              Change file
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-pd-border bg-pd-brand-muted/40 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Scissors className="h-4 w-4 shrink-0 text-pd-brand" />
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
              {tab === "split" && (
                <p className="mb-3 text-center text-xs text-pd-muted">
                  Click scissors between pages — <strong>Split here</strong> / <strong>Remove split</strong>
                </p>
              )}
              {tab === "extract" && (
                <p className="mb-3 text-center text-xs text-pd-muted">
                  Click pages to select · Use checkboxes · <strong>Finish</strong> to download
                </p>
              )}
              <div
                className={cn(
                  "flex flex-wrap items-start justify-center gap-y-3",
                  tab === "extract" && "gap-x-0 sm:gap-x-0"
                )}
              >
                {tab === "extract" &&
                  visibleSlots.map((slot, index) => (
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
                      <PageInsertDivider
                        onAddBlank={() => insertBlankAfter(index)}
                        onAddDocuments={() => openInsertDocuments(index)}
                      />
                    </div>
                  ))}

                {tab === "split" &&
                  splitVisibleSlots.map((slot, index) => {
                    const thumb = thumbnails[slot.page - 1];
                    const splitBetween = index < splitVisibleSlots.length - 1;
                    const splitActive = splitAfter.has(index);

                    return (
                      <div key={slot.id} className="flex items-start">
                        <SplitPageCard
                          pageNum={index + 1}
                          fileName={file.name}
                          thumb={thumb}
                          loadingThumb={loadingThumbs && !thumb}
                          rotation={rotations[slot.id] ?? 0}
                          mode="split"
                          onZoom={() => setZoomSlotId(slot.id)}
                          onRotateLeft={() => rotateSlot(slot.id, -90)}
                          onDuplicate={() => duplicateSlotAfter(slot.id)}
                          onRemove={() => removeSlot(slot.id)}
                        />
                        {splitBetween && (
                          <SplitDivider
                            active={splitActive}
                            onToggle={() => toggleSplitAfter(index)}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-pd-border px-3 py-2 text-center text-[11px] text-pd-muted sm:px-4">
          Rotate is preview-only · Files auto-delete after 2 hours
        </div>
      </div>
    </>
  );
}
