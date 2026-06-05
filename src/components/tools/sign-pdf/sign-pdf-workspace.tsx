"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Plus,
  Redo2,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/file";
import { Button } from "@/components/ui/button";
import {
  loadPdfDocumentPreview,
  loadPdfThumbnailsBatched,
  pageThumbFromSession,
} from "@/lib/pdf/pdf-thumbnails.client";
import { PdfPasswordModal } from "@/components/tools/pdf-password-modal";
import { clickToNorm } from "@/lib/pdf/pdf-coordinates";
import { ToolErrorBanner } from "@/components/tools/tool-ui";
import { SignatureCreateModal } from "@/components/tools/sign-pdf/signature-create-modal";
import { SignPageInsertDivider } from "@/components/tools/sign-pdf/sign-page-insert-divider";
import { SignPageThumb } from "@/components/tools/sign-pdf/sign-page-thumb";
import { SignThumbScrollPanel } from "@/components/tools/sign-pdf/sign-thumb-scroll-panel";
import {
  createOriginalSlots,
  duplicateSlot,
  slotThumbUrl,
  type WorkspacePageSlot,
} from "@/components/tools/split-pdf/split-page-types";
import type { ComposeSlot } from "@/lib/services/pdf-compose.service";
import type {
  PlacedAnnotation,
  SavedSignature,
  SignAnnotationPayload,
  SignTool,
} from "@/components/tools/sign-pdf/sign-pdf-types";

function workspaceSlotsToCompose(slots: WorkspacePageSlot[]): ComposeSlot[] {
  return slots.map((slot) => {
    if (slot.kind === "blank") return { kind: "blank" as const };
    if (slot.kind === "original") return { kind: "original" as const, page: slot.page };
    return { kind: "imported" as const, sessionId: slot.sessionId, page: slot.page };
  });
}

function isDefaultSlotOrder(slots: WorkspacePageSlot[], totalPages: number): boolean {
  if (slots.length !== totalPages) return false;
  return slots.every((s, i) => s.kind === "original" && s.page === i + 1);
}

const CANVAS_RENDER_WIDTH = 880;
const DEFAULT_SIG_WIDTH_NORM = 0.22;
const DEFAULT_SIG_HEIGHT_NORM = 0.08;
const DEFAULT_TEXT_HEIGHT_NORM = 0.035;
const DEFAULT_CHECK_SIZE_NORM = 0.035;

interface SignPdfWorkspaceProps {
  file: File;
  onReset: () => void;
  onComplete: (result: { url: string; filename: string; size: number }) => void;
}

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export function SignPdfWorkspace({ file, onReset, onComplete }: SignPdfWorkspaceProps) {
  const [sessionId, setSessionId] = useState("");
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageSlots, setPageSlots] = useState<WorkspacePageSlot[]>([]);
  const [slotRotations, setSlotRotations] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tool, setTool] = useState<SignTool>("select");
  const [annotations, setAnnotations] = useState<PlacedAnnotation[]>([]);
  const [history, setHistory] = useState<PlacedAnnotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [pendingSignature, setPendingSignature] = useState<SavedSignature | null>(null);
  const [signaturesOpen, setSignaturesOpen] = useState(false);
  const [modalKind, setModalKind] = useState<"signature" | "initials" | null>(null);
  const [dateIso, setDateIso] = useState(() => new Date().toISOString().slice(0, 10));
  const selectedDate = useMemo(() => formatDate(new Date(dateIso + "T12:00:00")), [dateIso]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<{
    file: File;
    fileName: string;
    errorMsg?: string;
    loading?: boolean;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const insertFileRef = useRef<HTMLInputElement>(null);
  const insertAfterIndexRef = useRef(0);
  const loadRef = useRef(0);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const signaturesRef = useRef<HTMLDivElement>(null);
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;

  const fileKey = `${file.name}:${file.size}:${file.lastModified}`;

  const visibleSlots = useMemo(() => pageSlots, [pageSlots]);

  const currentSlot = useMemo(() => {
    const idx = currentPage - 1;
    return visibleSlots[idx] ?? null;
  }, [visibleSlots, currentPage]);

  const canvasUrl = useMemo(() => {
    if (!currentSlot) return "";
    if (currentSlot.kind === "blank") return "";
    if (currentSlot.kind === "original" && sessionId) {
      return pageThumbFromSession(sessionId, currentSlot.page, CANVAS_RENDER_WIDTH);
    }
    if (currentSlot.kind === "imported") {
      return `/api/tools/pdf-thumb?session=${encodeURIComponent(currentSlot.sessionId)}&page=${currentSlot.page}&width=${CANVAS_RENDER_WIDTH}`;
    }
    return slotThumbUrl(currentSlot, thumbnails) ?? "";
  }, [currentSlot, sessionId, thumbnails]);

  const pageAnnotations = useMemo(
    () => annotations.filter((a) => a.page === currentPage),
    [annotations, currentPage]
  );

  const bumpAnnotationPagesAfter = useCallback((afterIndex: number, delta: number) => {
    if (delta === 0) return;
    setAnnotations((prev) =>
      prev.map((a) => (a.page > afterIndex + 1 ? { ...a, page: a.page + delta } : a))
    );
    setHistory((prev) =>
      prev.map((snap) =>
        snap.map((a) => (a.page > afterIndex + 1 ? { ...a, page: a.page + delta } : a))
      )
    );
  }, []);

  const remapAnnotationsOnDelete = useCallback((deletedPage: number) => {
    setAnnotations((prev) =>
      prev
        .filter((a) => a.page !== deletedPage)
        .map((a) => (a.page > deletedPage ? { ...a, page: a.page - 1 } : a))
    );
    setHistory((prev) =>
      prev.map((snap) =>
        snap
          .filter((a) => a.page !== deletedPage)
          .map((a) => (a.page > deletedPage ? { ...a, page: a.page - 1 } : a))
      )
    );
  }, []);

  const pushAnnotations = useCallback((next: PlacedAnnotation[]) => {
    setAnnotations(next);
    setHistoryIndex((i) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, i + 1);
        trimmed.push(next);
        return trimmed;
      });
      return i + 1;
    });
  }, []);

  const undo = () => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setAnnotations(history[idx]);
    setSelectedId(null);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setAnnotations(history[idx]);
    setSelectedId(null);
  };

  useEffect(() => {
    const requestId = ++loadRef.current;
    setLoading(true);
    setError(null);
    setSessionId("");
    setThumbnails([]);
    setTotalPages(0);
    setPageSlots([]);
    setCurrentPage(1);
    setAnnotations([]);
    setHistory([[]]);
    setHistoryIndex(0);

    loadPdfDocumentPreview(file).then((preview) => {
      if (requestId !== loadRef.current) return;
      if (preview.passwordRequired) {
        setPasswordPrompt({ file, fileName: preview.fileName ?? file.name });
        setLoading(false);
        return;
      }
      if (!preview.sessionId || preview.totalPages === 0) {
        setError(preview.error ?? "Could not read this PDF.");
        return;
      }
      setSessionId(preview.sessionId);
      setTotalPages(preview.totalPages);
    });

    loadPdfThumbnailsBatched(file, (thumbs, total) => {
      if (requestId !== loadRef.current) return;
      setThumbnails(thumbs);
      if (total > 0) {
        setTotalPages(total);
        setPageSlots(createOriginalSlots(total));
      }
      setLoading(false);
    }).then((result) => {
      if (requestId !== loadRef.current) return;
      if (result.passwordRequired) return;
      if (result.totalPages === 0) setError(result.error ?? "Could not read this PDF.");
      setLoading(false);
    });
  }, [fileKey, file]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (signaturesRef.current && !signaturesRef.current.contains(e.target as Node)) {
        setSignaturesOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const placeAnnotation = useCallback(
    (partial: Omit<PlacedAnnotation, "id">) => {
      const id = crypto.randomUUID();
      const next = [...annotationsRef.current, { ...partial, id }];
      pushAnnotations(next);
      setSelectedId(id);
      setTool("select");
    },
    [pushAnnotations]
  );

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (tool === "select") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { xNorm, yNorm } = clickToNorm(e.clientX, e.clientY, rect);

    if (tool === "signature" && pendingSignature) {
      const w = pendingSignature.kind === "initials" ? DEFAULT_SIG_WIDTH_NORM * 0.5 : DEFAULT_SIG_WIDTH_NORM;
      const h = pendingSignature.kind === "initials" ? DEFAULT_SIG_HEIGHT_NORM * 0.7 : DEFAULT_SIG_HEIGHT_NORM;
      placeAnnotation({
        page: currentPage,
        xNorm: Math.min(xNorm, 1 - w),
        yNorm: Math.min(yNorm, 1 - h),
        widthNorm: w,
        heightNorm: h,
        type: "image",
        dataUrl: pendingSignature.dataUrl,
      });
      return;
    }

    if (tool === "date") {
      placeAnnotation({
        page: currentPage,
        xNorm,
        yNorm,
        widthNorm: 0.18,
        heightNorm: DEFAULT_TEXT_HEIGHT_NORM,
        type: "date",
        text: selectedDate,
        fontSize: 16,
      });
      return;
    }

    if (tool === "text") {
      const text = window.prompt("Enter text", "Text")?.trim();
      if (!text) return;
      placeAnnotation({
        page: currentPage,
        xNorm,
        yNorm,
        widthNorm: Math.min(0.4, text.length * 0.012),
        heightNorm: DEFAULT_TEXT_HEIGHT_NORM,
        type: "text",
        text,
        fontSize: 14,
      });
      return;
    }

    if (tool === "check") {
      placeAnnotation({
        page: currentPage,
        xNorm,
        yNorm,
        widthNorm: DEFAULT_CHECK_SIZE_NORM,
        heightNorm: DEFAULT_CHECK_SIZE_NORM,
        type: "check",
      });
    }
  };

  const handleOverlayMouseDown = (
    e: ReactMouseEvent,
    id: string,
    xNorm: number,
    yNorm: number
  ) => {
    if (tool !== "select") return;
    e.stopPropagation();
    setSelectedId(id);
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: xNorm, origY: yNorm };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      const el = canvasRef.current;
      if (!drag || !el) return;
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - drag.startX) / rect.width;
      const dy = (e.clientY - drag.startY) / rect.height;
      const xNorm = Math.min(Math.max(drag.origX + dx, 0), 0.95);
      const yNorm = Math.min(Math.max(drag.origY + dy, 0), 0.95);
      setAnnotations((prev) =>
        prev.map((item) => (item.id === drag.id ? { ...item, xNorm, yNorm } : item))
      );
    };
    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        pushAnnotations([...annotationsRef.current]);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pushAnnotations]);

  const deleteSelected = () => {
    if (!selectedId) return;
    pushAnnotations(annotationsRef.current.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  };

  const insertBlankAfter = useCallback(
    (afterIndex: number) => {
      const newSlot: WorkspacePageSlot = { id: `blank-${crypto.randomUUID()}`, kind: "blank" };
      setPageSlots((prev) => {
        const next = [...prev];
        next.splice(afterIndex + 1, 0, newSlot);
        return next;
      });
      bumpAnnotationPagesAfter(afterIndex, 1);
      setCurrentPage(afterIndex + 2);
      setError(null);
    },
    [bumpAnnotationPagesAfter]
  );

  const duplicateSlotAt = useCallback(
    (index: number) => {
      const slot = visibleSlots[index];
      if (!slot) return;
      const copy = duplicateSlot(slot);
      setPageSlots((prev) => {
        const next = [...prev];
        next.splice(index + 1, 0, copy);
        return next;
      });
      bumpAnnotationPagesAfter(index, 1);
      setCurrentPage(index + 2);
    },
    [visibleSlots, bumpAnnotationPagesAfter]
  );

  const removeSlotAt = useCallback(
    (index: number) => {
      if (visibleSlots.length <= 1) {
        setError("Cannot delete the only remaining page.");
        return;
      }
      const deletedPage = index + 1;
      const slotId = visibleSlots[index]?.id;
      setPageSlots((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });
      if (slotId) {
        setSlotRotations((prev) => {
          const next = { ...prev };
          delete next[slotId];
          return next;
        });
      }
      remapAnnotationsOnDelete(deletedPage);
      setCurrentPage((p) => {
        if (p === deletedPage) return Math.max(1, p - 1);
        if (p > deletedPage) return p - 1;
        return p;
      });
      setError(null);
    },
    [visibleSlots, remapAnnotationsOnDelete]
  );

  const rotateSlotAt = useCallback((index: number) => {
    const slot = visibleSlots[index];
    if (!slot) return;
    setSlotRotations((prev) => ({
      ...prev,
      [slot.id]: ((prev[slot.id] ?? 0) - 90 + 360) % 360,
    }));
  }, [visibleSlots]);

  const openInsertDocuments = useCallback((afterIndex: number) => {
    insertAfterIndexRef.current = afterIndex;
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
      const afterIndex = insertAfterIndexRef.current;
      const newSlots: WorkspacePageSlot[] = Array.from({ length: data.totalPages }, (_, i) => ({
        id: `imp-${crypto.randomUUID()}`,
        kind: "imported" as const,
        page: i + 1,
        fileName: picked.name,
        sessionId: data.sessionId!,
      }));
      setPageSlots((prev) => {
        const next = [...prev];
        next.splice(afterIndex + 1, 0, ...newSlots);
        return next;
      });
      bumpAnnotationPagesAfter(afterIndex, data.totalPages);
      setCurrentPage(afterIndex + 2);
      setError(null);
    } catch {
      setError("Could not add document.");
    }
  };

  const canvasWidth = `${CANVAS_RENDER_WIDTH * zoom}px`;
  const currentRotation = currentSlot ? (slotRotations[currentSlot.id] ?? 0) : 0;

  const handleCreateSignature = (dataUrl: string, label: string) => {
    const entry: SavedSignature = {
      id: crypto.randomUUID(),
      label,
      dataUrl,
      kind: modalKind ?? "signature",
    };
    setSavedSignatures((prev) => [...prev, entry]);
    setPendingSignature(entry);
    setTool("signature");
    setModalKind(null);
  };

  const handleExport = async () => {
    if (annotations.length === 0) {
      setError("Add at least one signature or annotation before exporting.");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const imageDataUrls: string[] = [];
      const urlToIndex = new Map<string, number>();

      const payloads: SignAnnotationPayload[] = annotations.map((ann) => {
        if (ann.type === "image" && ann.dataUrl) {
          let idx = urlToIndex.get(ann.dataUrl);
          if (idx === undefined) {
            idx = imageDataUrls.length;
            imageDataUrls.push(ann.dataUrl);
            urlToIndex.set(ann.dataUrl, idx);
          }
          return {
            type: "image" as const,
            page: ann.page,
            xNorm: ann.xNorm,
            yNorm: ann.yNorm,
            widthNorm: ann.widthNorm,
            heightNorm: ann.heightNorm,
            imageIndex: idx,
          };
        }
        return {
          type: ann.type,
          page: ann.page,
          xNorm: ann.xNorm,
          yNorm: ann.yNorm,
          widthNorm: ann.widthNorm,
          heightNorm: ann.heightNorm,
          text: ann.text,
          fontSize: ann.fontSize,
        };
      });

      let pdfToSign: File = file;
      if (!isDefaultSlotOrder(visibleSlots, totalPages)) {
        const composeForm = new FormData();
        composeForm.append("file", file, file.name);
        composeForm.append("slots", JSON.stringify(workspaceSlotsToCompose(visibleSlots)));
        const composeRes = await fetch("/api/tools/compose-pdf", { method: "POST", body: composeForm });
        if (!composeRes.ok) {
          const data = await composeRes.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || "Failed to prepare PDF pages.");
        }
        const composedBlob = await composeRes.blob();
        pdfToSign = new File([composedBlob], file.name, { type: "application/pdf" });
      }

      const formData = new FormData();
      formData.append("file", pdfToSign, pdfToSign.name);
      formData.append("annotations", JSON.stringify(payloads));
      for (const dataUrl of imageDataUrls) {
        const blob = await dataUrlToBlob(dataUrl);
        formData.append("images", blob, "signature.png");
      }

      const res = await fetch("/api/tools/sign-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to export signed PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = file.name.replace(/\.pdf$/i, "") + "-signed.pdf";
      onComplete({ url, filename, size: blob.size });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setProcessing(false);
    }
  };

  const retryWithPassword = useCallback(
    (pw: string) => {
      if (!passwordPrompt) return;
      const { file: pFile } = passwordPrompt;
      setPasswordPrompt((prev) => (prev ? { ...prev, loading: true, errorMsg: undefined } : prev));

      loadPdfDocumentPreview(pFile, pw).then((preview) => {
        if (preview.wrongPassword) {
          setPasswordPrompt((prev) =>
            prev ? { ...prev, errorMsg: preview.error ?? "Incorrect password.", loading: false } : prev
          );
          return;
        }
        if (preview.passwordRequired) return;
        setPasswordPrompt(null);
        if (!preview.sessionId || preview.totalPages === 0) {
          setError(preview.error ?? "Could not read this PDF.");
          return;
        }
        setSessionId(preview.sessionId);
        setTotalPages(preview.totalPages);
        loadPdfThumbnailsBatched(pFile, (thumbs, total) => {
          setThumbnails(thumbs);
          if (total > 0) {
            setTotalPages(total);
            setPageSlots(createOriginalSlots(total));
          }
          setLoading(false);
        }, pw);
      });
    },
    [passwordPrompt]
  );

  if (passwordPrompt) {
    return (
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
    );
  }

  const cursorClass =
    tool === "signature" || tool === "date" || tool === "text" || tool === "check"
      ? "cursor-crosshair"
      : "";

  const signatureItems = savedSignatures.filter((s) => s.kind === "signature");
  const initialsItems = savedSignatures.filter((s) => s.kind === "initials");

  return (
    <>
      <input
        ref={insertFileRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleInsertDocuments}
      />

      {modalKind && (
        <SignatureCreateModal
          kind={modalKind}
          onClose={() => setModalKind(null)}
          onCreate={handleCreateSignature}
        />
      )}

      <div className="flex h-[calc(100vh-10.5rem)] min-h-[480px] max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-pd-border bg-[#f3f4f6] shadow-sm">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-pd-border bg-white px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-lg p-2 text-pd-muted hover:bg-pd-background lg:hidden"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-pd-muted">{formatFileSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-pd-muted hover:text-pd-foreground"
          >
            Change file
          </button>
          <Button size="sm" onClick={handleExport} disabled={processing || loading}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={cn(
              "relative z-10 h-full min-h-0 shrink-0 overflow-hidden bg-white",
              sidebarOpen ? "w-[7.85rem] sm:w-[8.85rem]" : "hidden lg:block lg:w-8"
            )}
          >
            {sidebarOpen && (
              <SignThumbScrollPanel className="absolute inset-0">
                {(loading ? [1, 2, 3] : visibleSlots).map((slot, index) => {
                  const pageNum = index + 1;
                  const active = pageNum === currentPage;
                  const thumb = loading ? undefined : slotThumbUrl(slot as WorkspacePageSlot, thumbnails);

                  return (
                    <div key={loading ? index : (slot as WorkspacePageSlot).id}>
                      {loading ? (
                        <div className="aspect-[3/4] animate-pulse rounded-lg bg-pd-border/40" />
                      ) : (
                        <SignPageThumb
                          pageNum={pageNum}
                          thumb={thumb}
                          isBlank={(slot as WorkspacePageSlot).kind === "blank"}
                          active={active}
                          onSelect={() => setCurrentPage(pageNum)}
                          onDuplicate={() => duplicateSlotAt(index)}
                          onRotate={() => rotateSlotAt(index)}
                          onRemove={() => removeSlotAt(index)}
                        />
                      )}
                      {!loading && (
                        <SignPageInsertDivider
                          onAddBlank={() => insertBlankAfter(index)}
                          onAddDocuments={() => openInsertDocuments(index)}
                        />
                      )}
                    </div>
                  );
                })}
              </SignThumbScrollPanel>
            )}
          </aside>

          <main className={cn("relative flex min-h-0 flex-1 flex-col overflow-auto", cursorClass)}>
            {error && (
              <div className="p-3">
                <ToolErrorBanner message={error} />
              </div>
            )}

            {loading && (
              <p className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                Loading pages…
              </p>
            )}

            <div className="relative flex flex-1 items-start justify-center p-4 sm:p-8">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-pd-brand" />
              ) : (
                <div
                  className="relative mx-auto shrink-0"
                  style={{ width: canvasWidth, maxWidth: "100%" }}
                >
                  <div className="mb-3 flex justify-center">
                    <div className="inline-flex w-fit flex-nowrap items-center gap-0.5 rounded-xl border border-pd-border bg-white/95 px-1.5 py-1 shadow-lg backdrop-blur-sm">
                      <button
                        type="button"
                        title="Select"
                        onClick={() => setTool("select")}
                        className={cn(
                          "rounded-lg p-2",
                          tool === "select" ? "bg-pd-brand-muted text-pd-brand" : "text-pd-muted hover:bg-pd-background"
                        )}
                      >
                        <MousePointer2 className="h-4 w-4" />
                      </button>

                      <div className="relative" ref={signaturesRef}>
                        <button
                          type="button"
                          onClick={() => setSignaturesOpen((v) => !v)}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium",
                            tool === "signature" ? "bg-pd-brand-muted text-pd-brand" : "text-pd-foreground hover:bg-pd-background"
                          )}
                        >
                          <PenLine className="h-4 w-4" />
                          Signatures
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        {signaturesOpen && (
                          <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-pd-border bg-white py-2 shadow-xl">
                            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pd-muted">
                              Signatures
                            </p>
                            {signatureItems.map((sig) => (
                              <button
                                key={sig.id}
                                type="button"
                                onClick={() => {
                                  setPendingSignature(sig);
                                  setTool("signature");
                                  setSignaturesOpen(false);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-pd-background"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={sig.dataUrl} alt="" className="h-8 max-w-[100px] object-contain" />
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setModalKind("signature");
                                setSignaturesOpen(false);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-pd-brand hover:bg-pd-brand-muted"
                            >
                              <Plus className="h-4 w-4" />
                              New signature
                            </button>
                            <div className="my-1 border-t border-pd-border" />
                            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pd-muted">
                              Initials
                            </p>
                            {initialsItems.map((sig) => (
                              <button
                                key={sig.id}
                                type="button"
                                onClick={() => {
                                  setPendingSignature(sig);
                                  setTool("signature");
                                  setSignaturesOpen(false);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-pd-background"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={sig.dataUrl} alt="" className="h-8 max-w-[80px] object-contain" />
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setModalKind("initials");
                                setSignaturesOpen(false);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-pd-brand hover:bg-pd-brand-muted"
                            >
                              <Plus className="h-4 w-4" />
                              New initials
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          title="Date"
                          onClick={() => {
                            setTool("date");
                            setShowDatePicker((v) => !v);
                          }}
                          className={cn(
                            "rounded-lg p-2",
                            tool === "date" ? "bg-pd-brand-muted text-pd-brand" : "text-pd-muted hover:bg-pd-background"
                          )}
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                        {showDatePicker && (
                          <div className="absolute left-0 top-full z-30 mt-1 rounded-xl border border-pd-border bg-white p-3 shadow-xl">
                            <input
                              type="date"
                              value={dateIso}
                              onChange={(e) => e.target.value && setDateIso(e.target.value)}
                              className="rounded-lg border border-pd-border px-2 py-1 text-sm"
                            />
                            <p className="mt-2 text-xs text-pd-muted">Click on the page to place {selectedDate}</p>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        title="Text"
                        onClick={() => setTool("text")}
                        className={cn(
                          "rounded-lg p-2",
                          tool === "text" ? "bg-pd-brand-muted text-pd-brand" : "text-pd-muted hover:bg-pd-background"
                        )}
                      >
                        <Type className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        title="Checkmark"
                        onClick={() => setTool("check")}
                        className={cn(
                          "rounded-lg p-2",
                          tool === "check" ? "bg-pd-brand-muted text-pd-brand" : "text-pd-muted hover:bg-pd-background"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </button>

                      <div className="mx-1 h-5 w-px bg-pd-border" />

                      <button
                        type="button"
                        title="Undo"
                        disabled={historyIndex <= 0}
                        onClick={undo}
                        className="rounded-lg p-2 text-pd-muted hover:bg-pd-background disabled:opacity-30"
                      >
                        <Undo2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Redo"
                        disabled={historyIndex >= history.length - 1}
                        onClick={redo}
                        className="rounded-lg p-2 text-pd-muted hover:bg-pd-background disabled:opacity-30"
                      >
                        <Redo2 className="h-4 w-4" />
                      </button>

                      {selectedId && (
                        <>
                          <div className="mx-1 h-5 w-px bg-pd-border" />
                          <button
                            type="button"
                            title="Delete"
                            onClick={deleteSelected}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {tool === "signature" && pendingSignature && (
                    <p className="mb-2 text-center text-xs text-pd-brand">
                      Click on the page to place your {pendingSignature.kind}
                    </p>
                  )}

                  <div
                    ref={canvasRef}
                    className={cn("relative w-full bg-white shadow-xl select-none", cursorClass)}
                    onClick={handleCanvasClick}
                  >
                    {currentSlot?.kind === "blank" ? (
                      <div className="flex aspect-[3/4] w-full items-center justify-center bg-white text-sm text-pd-muted">
                        Blank page
                      </div>
                    ) : canvasUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={canvasUrl}
                        alt={`Page ${currentPage}`}
                        className="block h-auto w-full pointer-events-none"
                        style={{
                          transform: currentRotation ? `rotate(${currentRotation}deg)` : undefined,
                          transformOrigin: "center center",
                        }}
                        draggable={false}
                      />
                    ) : (
                      <div className="flex aspect-[3/4] w-full items-center justify-center bg-slate-50">
                        <Loader2 className="h-6 w-6 animate-spin text-pd-brand" />
                      </div>
                    )}

                    {pageAnnotations.map((ann) => {
                      const selected = selectedId === ann.id;
                      if (ann.type === "image" && ann.dataUrl) {
                        return (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={ann.id}
                            src={ann.dataUrl}
                            alt=""
                            draggable={false}
                            className={cn(
                              "absolute cursor-move object-contain",
                              selected && "ring-2 ring-pd-brand ring-offset-1"
                            )}
                            style={{
                              left: `${ann.xNorm * 100}%`,
                              top: `${ann.yNorm * 100}%`,
                              width: `${ann.widthNorm * 100}%`,
                              height: `${ann.heightNorm * 100}%`,
                            }}
                            onMouseDown={(e) => handleOverlayMouseDown(e, ann.id, ann.xNorm, ann.yNorm)}
                          />
                        );
                      }
                      if (ann.type === "text" || ann.type === "date") {
                        return (
                          <div
                            key={ann.id}
                            className={cn(
                              "absolute cursor-move whitespace-nowrap font-medium text-black",
                              selected && "ring-2 ring-pd-brand ring-offset-1"
                            )}
                            style={{
                              left: `${ann.xNorm * 100}%`,
                              top: `${ann.yNorm * 100}%`,
                              fontSize: `${(ann.fontSize ?? 14) * zoom * 0.85}px`,
                            }}
                            onMouseDown={(e) => handleOverlayMouseDown(e, ann.id, ann.xNorm, ann.yNorm)}
                          >
                            {ann.text}
                          </div>
                        );
                      }
                      if (ann.type === "check") {
                        return (
                          <div
                            key={ann.id}
                            className={cn(
                              "absolute flex cursor-move items-center justify-center font-bold text-black",
                              selected && "ring-2 ring-pd-brand ring-offset-1"
                            )}
                            style={{
                              left: `${ann.xNorm * 100}%`,
                              top: `${ann.yNorm * 100}%`,
                              width: `${ann.widthNorm * 100}%`,
                              height: `${ann.heightNorm * 100}%`,
                              fontSize: `${ann.heightNorm * CANVAS_RENDER_WIDTH * zoom * 0.5}px`,
                            }}
                            onMouseDown={(e) => handleOverlayMouseDown(e, ann.id, ann.xNorm, ann.yNorm)}
                          >
                            ✓
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {!loading && visibleSlots.length > 0 && (
              <div className="pointer-events-none sticky bottom-4 flex justify-center pb-4">
                <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#1f2937]/90 px-2 py-1.5 text-white shadow-lg">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[4rem] text-center text-xs">
                    {currentPage} / {visibleSlots.length}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= visibleSlots.length}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="mx-1 h-4 w-px bg-white/20" />
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                    className="rounded-full p-1.5 hover:bg-white/10"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2.5rem] text-center text-xs">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                    className="rounded-full p-1.5 hover:bg-white/10"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-pd-muted">
        <strong>Signatures</strong> — create or pick one, then click the page · <strong>Date / Text / Check</strong> — select tool, click to place · Drag to reposition · Export when done
      </p>
    </>
  );
}
