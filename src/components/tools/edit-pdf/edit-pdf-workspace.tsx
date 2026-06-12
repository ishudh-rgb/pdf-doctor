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
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
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
import {
  clickToNorm,
  dimensionsFromAspect,
  normToPdfCoords,
} from "@/lib/pdf/pdf-coordinates";
import { resolvePdfFontKey, fontCssFamily } from "@/lib/edit-pdf/fonts";
import { fontSizePtToPx, whiteoutRectStyle, cappedLineHeightNorm } from "@/lib/edit-pdf/canvas-utils";
import type { PdfTextBlock } from "@/lib/pdf/pdf-edit-text-blocks.server";
import { EditPdfToolbar } from "@/components/tools/edit-pdf/edit-pdf-toolbar";
import {
  DEFAULT_TEXT_STYLE,
  type DrawStroke,
  type EditImageItem,
  type EditShapeItem,
  type EditTextItem,
  type EditTool,
  type ExportStrokeOp,
  type TextStyle,
} from "@/components/tools/edit-pdf/edit-pdf-types";
import { ToolErrorBanner, ToolWorkspaceReadyPanel } from "@/components/tools/tool-ui";

const CANVAS_RENDER_WIDTH = 880;
const DEFAULT_IMAGE_WIDTH_NORM = 0.22;

interface EditPdfWorkspaceProps {
  file: File;
  onChangeFile: () => void;
  onReset: () => void;
}

function textDecorationClass(decoration: TextStyle["decoration"]): string {
  switch (decoration) {
    case "highlight":
      return "bg-yellow-200/70";
    case "underline":
      return "underline";
    case "strikethrough":
      return "line-through";
    case "squiggle":
      return "underline decoration-wavy";
    default:
      return "";
  }
}

export function EditPdfWorkspace({ file, onChangeFile, onReset }: EditPdfWorkspaceProps) {
  const [sessionId, setSessionId] = useState("");
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tool, setTool] = useState<EditTool>("edit-text");
  const [nativeBlocks, setNativeBlocks] = useState<PdfTextBlock[]>([]);
  const [textItems, setTextItems] = useState<EditTextItem[]>([]);
  const [imageItems, setImageItems] = useState<EditImageItem[]>([]);
  const [shapeItems, setShapeItems] = useState<EditShapeItem[]>([]);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<"text" | "image" | "shape" | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [selectedNativeBlockId, setSelectedNativeBlockId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pageAspect, setPageAspect] = useState<Record<number, number>>({});
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<{
    file: File;
    fileName: string;
    errorMsg?: string;
    loading?: boolean;
  } | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [activeStroke, setActiveStroke] = useState<DrawStroke | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [canvasWidthPx, setCanvasWidthPx] = useState(CANVAS_RENDER_WIDTH);
  const [shapeDraft, setShapeDraft] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadRef = useRef(0);
  const dragRef = useRef<{
    id: string;
    kind: "text" | "image" | "shape";
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const fileKey = `${file.name}:${file.size}:${file.lastModified}`;

  const canvasUrl = useMemo(
    () => (sessionId ? pageThumbFromSession(sessionId, currentPage, CANVAS_RENDER_WIDTH) : ""),
    [sessionId, currentPage]
  );

  const pageTexts = useMemo(
    () => textItems.filter((t) => t.page === currentPage),
    [textItems, currentPage]
  );
  const pageImages = useMemo(
    () => imageItems.filter((i) => i.page === currentPage),
    [imageItems, currentPage]
  );
  const pageShapes = useMemo(
    () => shapeItems.filter((s) => s.page === currentPage),
    [shapeItems, currentPage]
  );
  const pageStrokes = useMemo(
    () => strokes.filter((s) => s.page === currentPage),
    [strokes, currentPage]
  );
  const pageNativeBlocks = useMemo(
    () => nativeBlocks.filter((b) => b.page === currentPage),
    [nativeBlocks, currentPage]
  );

  const selectedTextItem = useMemo(
    () => (selectedKind === "text" && selectedId ? textItems.find((t) => t.id === selectedId) : null),
    [selectedKind, selectedId, textItems]
  );

  const selectedNativeBlock = useMemo(
    () =>
      selectedNativeBlockId
        ? nativeBlocks.find((b) => b.id === selectedNativeBlockId) ?? null
        : null,
    [selectedNativeBlockId, nativeBlocks]
  );

  const toolbarTextStyle = useMemo((): TextStyle | null => {
    if (selectedTextItem) return selectedTextItem;
    if (selectedNativeBlock) {
      return {
        fontId: selectedNativeBlock.fontId,
        fontSize: selectedNativeBlock.fontSize,
        color: "#000000",
        bold: selectedNativeBlock.bold,
        italic: selectedNativeBlock.italic,
        align: "left",
        decoration: "none",
      };
    }
    return null;
  }, [selectedTextItem, selectedNativeBlock]);

  const editedNativeIds = useMemo(
    () =>
      new Set(
        textItems.filter((t) => t.nativeBlockId && t.isDirty).map((t) => t.nativeBlockId!)
      ),
    [textItems]
  );

  const currentPageHeightPt = useMemo(() => {
    const aspect = pageAspect[currentPage] ?? 792 / 612;
    return dimensionsFromAspect(aspect).heightPt;
  }, [pageAspect, currentPage]);

  useEffect(() => {
    const requestId = ++loadRef.current;
    setLoading(true);
    setLoadingText(true);
    setError(null);
    setSessionId("");
    setThumbnails([]);
    setTotalPages(0);
    setCurrentPage(1);
    setTextItems([]);
    setImageItems([]);
    setShapeItems([]);
    setStrokes([]);
    setNativeBlocks([]);
    setSelectedId(null);
    setSelectedNativeBlockId(null);

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
      if (total > 0) setTotalPages(total);
      setLoading(false);
    }).then((result) => {
      if (requestId !== loadRef.current) return;
      if (result.passwordRequired) return;
      if (result.totalPages === 0) setError(result.error ?? "Could not read this PDF.");
      setLoading(false);
    });

    const fd = new FormData();
    fd.append("file", file, file.name);
    fetch("/api/tools/pdf-text-blocks", { method: "POST", body: fd })
      .then((r) => r.json())
      .then((data: { blocks?: PdfTextBlock[]; error?: string }) => {
        if (requestId !== loadRef.current) return;
        if (data.blocks) setNativeBlocks(data.blocks);
        else if (data.error) console.warn("[edit-pdf] text blocks:", data.error);
      })
      .catch(() => {})
      .finally(() => {
        if (requestId === loadRef.current) setLoadingText(false);
      });
  }, [fileKey, file]);

  useEffect(() => {
    return () => imageItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, [imageItems]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCanvasWidthPx(el.clientWidth || CANVAS_RENDER_WIDTH * zoom);
    });
    ro.observe(el);
    setCanvasWidthPx(el.clientWidth || CANVAS_RENDER_WIDTH * zoom);
    return () => ro.disconnect();
  }, [zoom, loading, currentPage]);

  const nativeBlockToItem = (block: PdfTextBlock, isDirty: boolean): EditTextItem => ({
    id: crypto.randomUUID(),
    nativeBlockId: block.id,
    text: block.text,
    page: block.page,
    xNorm: block.xNorm,
    yNorm: block.yNorm,
    widthNorm: block.widthNorm,
    heightNorm: block.heightNorm,
    singleLine: block.singleLine,
    fontSize: block.fontSize,
    fontId: block.fontId,
    bold: block.bold,
    italic: block.italic,
    color: "#000000",
    align: "left",
    decoration: "none",
    isDirty,
  });

  const beginNativeEdit = (block: PdfTextBlock, startTyping = false) => {
    setSelectedNativeBlockId(block.id);
    setSelectedKind("text");
    const existing = textItems.find((t) => t.nativeBlockId === block.id);
    if (existing) {
      setSelectedId(existing.id);
      if (startTyping || !existing.isDirty) {
        setTextItems((prev) =>
          prev.map((t) => (t.id === existing.id ? { ...t, isDirty: true } : t))
        );
      }
      if (startTyping) setEditingTextId(existing.id);
      return;
    }
    const item = nativeBlockToItem(block, true);
    setTextItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    if (startTyping) setEditingTextId(item.id);
  };

  const updateSelectedTextStyle = (patch: Partial<TextStyle>) => {
    if (selectedKind !== "text") return;

    if (selectedId) {
      setTextItems((prev) =>
        prev.map((t) =>
          t.id === selectedId ? { ...t, ...patch, isDirty: t.nativeBlockId ? true : t.isDirty } : t
        )
      );
      return;
    }

    if (selectedNativeBlock) {
      setTextItems((prev) => {
        const existing = prev.find((t) => t.nativeBlockId === selectedNativeBlock.id);
        if (existing) {
          setSelectedId(existing.id);
          return prev.map((t) =>
            t.id === existing.id ? { ...t, ...patch, isDirty: true } : t
          );
        }
        const item = { ...nativeBlockToItem(selectedNativeBlock, true), ...patch };
        setSelectedId(item.id);
        return [...prev, item];
      });
    }
  };

  const selectNativeBlock = (block: PdfTextBlock) => {
    setSelectedNativeBlockId(block.id);
    setSelectedKind("text");
    const existing = textItems.find((t) => t.nativeBlockId === block.id && t.isDirty);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    setSelectedId(null);
    setEditingTextId(null);
  };

  const addTextAt = (xNorm: number, yNorm: number) => {
    const id = crypto.randomUUID();
    setTextItems((prev) => [
      ...prev,
      { ...DEFAULT_TEXT_STYLE, id, text: "New text", page: currentPage, xNorm, yNorm },
    ]);
    setSelectedId(id);
    setSelectedKind("text");
    setEditingTextId(id);
    setTool("select");
  };

  const addImageAt = (xNorm: number, yNorm: number, imageFile: File) => {
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(imageFile);
    setImageItems((prev) => [
      ...prev,
      {
        id,
        file: imageFile,
        previewUrl,
        page: currentPage,
        xNorm,
        yNorm,
        widthNorm: DEFAULT_IMAGE_WIDTH_NORM,
        heightNorm: DEFAULT_IMAGE_WIDTH_NORM * 0.75,
      },
    ]);
    setPendingImage(null);
    setSelectedId(id);
    setSelectedKind("image");
    setTool("select");
  };

  const finishShape = (startX: number, startY: number, endX: number, endY: number) => {
    const xNorm = Math.min(startX, endX);
    const yNorm = Math.min(startY, endY);
    const widthNorm = Math.abs(endX - startX);
    const heightNorm = Math.abs(endY - startY);
    if (widthNorm < 0.01 || heightNorm < 0.01) return;
    const id = crypto.randomUUID();
    setShapeItems((prev) => [
      ...prev,
      {
        id,
        page: currentPage,
        xNorm,
        yNorm,
        widthNorm,
        heightNorm,
        strokeColor: "#2563eb",
        strokeWidth: 2,
      },
    ]);
    setSelectedId(id);
    setSelectedKind("shape");
  };

  const handleCanvasMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { xNorm, yNorm } = clickToNorm(e.clientX, e.clientY, rect);

    if (tool === "draw-pencil" || tool === "draw-highlighter") {
      const stroke: DrawStroke = {
        id: crypto.randomUUID(),
        page: currentPage,
        points: [{ xNorm, yNorm }],
        color: tool === "draw-highlighter" ? "#FFFF00" : "#000000",
        widthNorm: tool === "draw-highlighter" ? 0.012 : 0.003,
        tool: tool === "draw-highlighter" ? "highlighter" : "pencil",
      };
      setActiveStroke(stroke);
      return;
    }

    if (tool === "draw-eraser") {
      const hit = strokes.find((s) => s.page === currentPage && s.points.some(
        (p) => Math.hypot(p.xNorm - xNorm, p.yNorm - yNorm) < 0.02
      ));
      if (hit) setStrokes((prev) => prev.filter((s) => s.id !== hit.id));
      return;
    }

    if (tool === "shape-rect") {
      setShapeDraft({ startX: xNorm, startY: yNorm, endX: xNorm, endY: yNorm });
      return;
    }

    if (tool === "add-text") {
      addTextAt(xNorm, yNorm);
      return;
    }

    if (tool === "image" && pendingImage) {
      addImageAt(xNorm, yNorm, pendingImage);
      return;
    }

    if (tool === "edit-text") {
      const hits = pageNativeBlocks.filter(
        (b) =>
          xNorm >= b.xNorm &&
          xNorm <= b.xNorm + b.widthNorm &&
          yNorm >= b.yNorm &&
          yNorm <= b.yNorm + b.heightNorm
      );
      if (hits.length) {
        const hit = hits.reduce((a, b) =>
          a.widthNorm * a.heightNorm <= b.widthNorm * b.heightNorm ? a : b
        );
        selectNativeBlock(hit);
      } else {
        setSelectedNativeBlockId(null);
        setSelectedId(null);
        setSelectedKind(null);
        setEditingTextId(null);
      }
      return;
    }

    setSelectedNativeBlockId(null);
    setSelectedId(null);
    setSelectedKind(null);
    setEditingTextId(null);
  };

  const handleCanvasMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { xNorm, yNorm } = clickToNorm(e.clientX, e.clientY, rect);

    if (activeStroke) {
      setActiveStroke((s) =>
        s ? { ...s, points: [...s.points, { xNorm, yNorm }] } : null
      );
      return;
    }

    if (shapeDraft) {
      setShapeDraft((d) => (d ? { ...d, endX: xNorm, endY: yNorm } : null));
    }
  };

  const handleCanvasMouseUp = () => {
    if (activeStroke && activeStroke.points.length > 1) {
      setStrokes((prev) => [...prev, activeStroke]);
    }
    setActiveStroke(null);

    if (shapeDraft) {
      finishShape(shapeDraft.startX, shapeDraft.startY, shapeDraft.endX, shapeDraft.endY);
      setShapeDraft(null);
      setTool("select");
    }
  };

  const handleOverlayMouseDown = (
    e: ReactMouseEvent,
    id: string,
    kind: "text" | "image" | "shape",
    xNorm: number,
    yNorm: number
  ) => {
    if (tool !== "select" && tool !== "edit-text") return;
    e.stopPropagation();
    setSelectedId(id);
    setSelectedKind(kind);
    dragRef.current = { id, kind, startX: e.clientX, startY: e.clientY, origX: xNorm, origY: yNorm };
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

      if (drag.kind === "text") {
        setTextItems((prev) => prev.map((item) => (item.id === drag.id ? { ...item, xNorm, yNorm } : item)));
      } else if (drag.kind === "image") {
        setImageItems((prev) => prev.map((item) => (item.id === drag.id ? { ...item, xNorm, yNorm } : item)));
      } else {
        setShapeItems((prev) => prev.map((item) => (item.id === drag.id ? { ...item, xNorm, yNorm } : item)));
      }
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedKind === "text" && selectedId) {
      const removed = textItems.find((t) => t.id === selectedId);
      if (removed?.nativeBlockId) setSelectedNativeBlockId(null);
      setTextItems((prev) => prev.filter((t) => t.id !== selectedId));
    } else if (selectedKind === "image" && selectedId) {
      setImageItems((prev) => {
        const removed = prev.find((i) => i.id === selectedId);
        if (removed) URL.revokeObjectURL(removed.previewUrl);
        return prev.filter((i) => i.id !== selectedId);
      });
    } else if (selectedKind === "shape" && selectedId) {
      setShapeItems((prev) => prev.filter((s) => s.id !== selectedId));
    } else if (selectedKind === "text" && selectedNativeBlockId) {
      // Selected native block, not yet edited — clear highlight only
    } else {
      return;
    }
    setSelectedId(null);
    setSelectedKind(null);
    setEditingTextId(null);
    setSelectedNativeBlockId(null);
  }, [selectedId, selectedKind, selectedNativeBlockId, textItems]);

  const handleExport = async () => {
    setProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const texts = textItems
        .filter((item) => !item.nativeBlockId || item.isDirty)
        .map((item) => {
        const aspect = pageAspect[item.page] ?? 792 / 612;
        const dims = dimensionsFromAspect(aspect);
        const { x, y } = normToPdfCoords(item.xNorm, item.yNorm, dims, {
          fontSize: item.fontSize,
          heightNorm: item.heightNorm,
        });
        const op: Record<string, unknown> = {
          text: item.text,
          x,
          y,
          page: item.page,
          fontSize: item.fontSize,
          color: item.color,
          fontKey: resolvePdfFontKey(item.fontId, item.bold, item.italic),
          decoration: item.decoration,
          align: item.align,
        };
        if (item.nativeBlockId && item.widthNorm) {
          const hNorm = cappedLineHeightNorm(
            item.fontSize,
            item.heightNorm ?? 0.03,
            dims.heightPt
          );
          op.whiteout = {
            x: item.xNorm * dims.widthPt - 2,
            y: dims.heightPt - (item.yNorm + hNorm) * dims.heightPt - 2,
            width: item.widthNorm * dims.widthPt + 6,
            height: hNorm * dims.heightPt + 6,
          };
          op.boxWidth = item.widthNorm * dims.widthPt;
        }
        return op;
      });

      const images = imageItems.map((item, imageIndex) => {
        const aspect = pageAspect[item.page] ?? 792 / 612;
        const dims = dimensionsFromAspect(aspect);
        const { x, y } = normToPdfCoords(item.xNorm, item.yNorm, dims, { heightNorm: item.heightNorm });
        return {
          imageIndex,
          x,
          y,
          width: item.widthNorm * dims.widthPt,
          height: item.heightNorm * dims.heightPt,
          page: item.page,
        };
      });

      const shapes = shapeItems.map((item) => {
        const aspect = pageAspect[item.page] ?? 792 / 612;
        const dims = dimensionsFromAspect(aspect);
        return {
          x: item.xNorm * dims.widthPt,
          y: dims.heightPt - (item.yNorm + item.heightNorm) * dims.heightPt,
          width: item.widthNorm * dims.widthPt,
          height: item.heightNorm * dims.heightPt,
          page: item.page,
          strokeColor: item.strokeColor,
          strokeWidth: item.strokeWidth,
        };
      });

      const strokeOps: ExportStrokeOp[] = strokes.map((s) => {
        const aspect = pageAspect[s.page] ?? 792 / 612;
        const dims = dimensionsFromAspect(aspect);
        return {
          page: s.page,
          points: s.points.map((p) => ({
            x: p.xNorm * dims.widthPt,
            y: dims.heightPt - p.yNorm * dims.heightPt,
          })),
          color: s.color,
          width: s.widthNorm * dims.widthPt,
          opacity: s.tool === "highlighter" ? 0.45 : 1,
        };
      });

      formData.append("operations", JSON.stringify({ texts, images, shapes, strokes: strokeOps }));
      imageItems.forEach((item) => formData.append("images", item.file));

      const res = await fetch("/api/tools/edit-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to export PDF.");
      }
      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setProcessing(false);
    }
  };

  const placeSignature = () => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], "signature.png", { type: "image/png" });
      setPendingImage(f);
      setTool("image");
      setShowSignModal(false);
    }, "image/png");
  };

  const retryEditWithPassword = useCallback((pw: string) => {
    if (!passwordPrompt) return;
    const { file: pFile } = passwordPrompt;
    setPasswordPrompt((prev) => prev ? { ...prev, loading: true, errorMsg: undefined } : prev);

    loadPdfDocumentPreview(pFile, pw).then((preview) => {
      if (preview.wrongPassword) {
        setPasswordPrompt((prev) => prev ? { ...prev, errorMsg: preview.error ?? "Incorrect password.", loading: false } : prev);
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
        if (total > 0) setTotalPages(total);
        setLoading(false);
      }, pw);
    });
  }, [passwordPrompt]);

  if (passwordPrompt) {
    return (
      <PdfPasswordModal
        fileName={passwordPrompt.fileName}
        errorMessage={passwordPrompt.errorMsg}
        loading={passwordPrompt.loading}
        onSubmit={retryEditWithPassword}
        onCancel={() => { setPasswordPrompt(null); onReset(); }}
      />
    );
  }

  if (completed && resultUrl) {
    return (
      <ToolWorkspaceReadyPanel
        title="PDF exported"
        description="Your edited document is ready."
        downloadUrl={resultUrl}
        downloadFilename="edited.pdf"
        downloadLabel="Download PDF"
        resultSizeBytes={resultSize}
        resetLabel="Edit another file"
        onReset={() => {
          setCompleted(false);
          setResultUrl(null);
          setResultSize(0);
          onReset();
        }}
      />
    );
  }

  const cursorClass =
    tool === "add-text" || tool === "edit-text" ? "cursor-crosshair"
    : tool.startsWith("draw-") ? "cursor-crosshair"
    : tool === "shape-rect" ? "cursor-crosshair"
    : tool === "hand" ? "cursor-grab active:cursor-grabbing" : "";

  return (
    <>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (picked?.type.startsWith("image/")) { setPendingImage(picked); setTool("image"); }
        }} />

      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h3 className="font-semibold text-pd-foreground">Draw signature</h3>
            <canvas ref={signCanvasRef} width={360} height={120}
              className="mt-3 w-full rounded-lg border border-pd-border bg-white"
              onMouseDown={(e) => {
                const c = signCanvasRef.current!;
                const ctx = c.getContext("2d")!;
                const r = c.getBoundingClientRect();
                ctx.beginPath();
                ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
                c.onmousemove = (ev) => {
                  ctx.lineTo(ev.clientX - r.left, ev.clientY - r.top);
                  ctx.strokeStyle = "#000";
                  ctx.lineWidth = 2;
                  ctx.stroke();
                };
              }}
              onMouseUp={() => { if (signCanvasRef.current) signCanvasRef.current.onmousemove = null; }}
            />
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={placeSignature}>Place on PDF</Button>
              <Button size="sm" variant="outline" onClick={() => setShowSignModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-pd-border bg-[#f3f4f6] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-pd-border bg-white px-3 py-2 sm:px-4">
          <button type="button" onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-lg p-2 text-pd-muted hover:bg-pd-background lg:hidden">
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-pd-muted">{formatFileSize(file.size)}</p>
          </div>
          <Button size="sm" onClick={handleExport} disabled={processing || loading}>
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </Button>
        </div>

        <div className="flex min-h-[520px] lg:min-h-[calc(100vh-18rem)]">
          <aside className={cn("shrink-0 overflow-y-auto border-r border-pd-border bg-white",
            sidebarOpen ? "w-28 sm:w-32" : "hidden lg:block lg:w-8")}>
            {sidebarOpen && (
              <div className="space-y-3 p-2">
                {(loading ? [1, 2, 3] : thumbnails).map((thumb, index) => {
                  const pageNum = index + 1;
                  const active = pageNum === currentPage;
                  if (loading) return <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-pd-border/40" />;
                  return (
                    <button key={pageNum} type="button" onClick={() => setCurrentPage(pageNum)}
                      className={cn("relative w-full overflow-hidden rounded-lg border-2 bg-white shadow-sm",
                        active ? "border-pd-brand ring-2 ring-pd-brand/20" : "border-transparent hover:border-pd-border")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb as string} alt={`Page ${pageNum}`} className="aspect-[3/4] w-full object-cover object-top" />
                      <span className={cn("absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        active ? "bg-pd-brand text-white" : "bg-black/60 text-white")}>{pageNum}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <main className={cn("relative flex flex-1 flex-col overflow-auto", cursorClass)}>
            {error && <div className="p-3"><ToolErrorBanner message={error} /></div>}
            {(loading || loadingText) && (
              <p className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                {loading ? "Loading pages…" : "Detecting editable text…"}
              </p>
            )}

            <div className="relative flex flex-1 items-start justify-center p-4 sm:p-8">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-pd-brand" />
              ) : (
                <div className="relative w-full max-w-full">
                  {/* Floating toolbar over canvas (Smallpdf-style) */}
                  <div className="pointer-events-none absolute left-1/2 top-2 z-20 w-full max-w-3xl -translate-x-1/2 px-2">
                    <div className="pointer-events-auto rounded-xl border border-pd-border bg-white/95 shadow-lg backdrop-blur-sm">
                      <EditPdfToolbar
                        tool={tool}
                        onToolChange={setTool}
                        selectedTextStyle={toolbarTextStyle}
                        onStyleChange={updateSelectedTextStyle}
                        onDeleteSelected={deleteSelected}
                        hasSelection={Boolean(selectedId) || Boolean(selectedNativeBlockId)}
                        onSignClick={() => {
                          setShowSignModal(true);
                          setTool("sign");
                        }}
                        onImageClick={() => {
                          imageInputRef.current?.click();
                          setTool("image");
                        }}
                      />
                    </div>
                  </div>

                <div
                  ref={canvasRef}
                  className={cn("relative mt-14 bg-white shadow-xl select-none", cursorClass)}
                  style={{ width: `${CANVAS_RENDER_WIDTH * zoom}px`, maxWidth: "100%" }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={canvasUrl} alt={`Page ${currentPage}`} className="block h-auto w-full pointer-events-none"
                    draggable={false}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth > 0) {
                        setPageAspect((p) => ({ ...p, [currentPage]: img.naturalHeight / img.naturalWidth }));
                      }
                    }} />

                  {/* Whiteout layer — hides original raster text under edits (fixes ghosting) */}
                  {pageTexts
                    .filter(
                      (item) =>
                        item.nativeBlockId &&
                        item.isDirty &&
                        item.widthNorm &&
                        item.heightNorm
                    )
                    .map((item) => (
                      <div
                        key={`wo-${item.id}`}
                        className="absolute bg-white"
                        style={whiteoutRectStyle(
                          item.xNorm,
                          item.yNorm,
                          item.widthNorm!,
                          item.heightNorm!,
                          item.fontSize,
                          currentPageHeightPt
                        )}
                      />
                    ))}

                  {/* Native text blocks (Edit Text mode) — hover targets only */}
                  {tool === "edit-text" &&
                    pageNativeBlocks.map((block) => {
                      if (editedNativeIds.has(block.id)) return null;
                      const hovered = hoveredBlockId === block.id;
                      const selected = selectedNativeBlockId === block.id;
                      return (
                        <button
                          key={block.id}
                          type="button"
                          className={cn(
                            "absolute border transition-colors",
                            selected || hovered
                              ? "border-pd-brand bg-pd-brand/10 border-solid z-[5]"
                              : "border-dashed border-pd-brand/50 bg-transparent hover:bg-pd-brand/5"
                          )}
                          style={{
                            left: `${block.xNorm * 100}%`,
                            top: `${block.yNorm * 100}%`,
                            width: `${block.widthNorm * 100}%`,
                            height: `${cappedLineHeightNorm(block.fontSize, block.heightNorm, currentPageHeightPt) * 100}%`,
                          }}
                          onMouseEnter={() => setHoveredBlockId(block.id)}
                          onMouseLeave={() => setHoveredBlockId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectNativeBlock(block);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            beginNativeEdit(block, true);
                          }}
                          title={block.text.slice(0, 80)}
                        />
                      );
                    })}

                  {/* Draw strokes SVG */}
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {[...pageStrokes, ...(activeStroke ? [activeStroke] : [])].map((s) => (
                      <polyline
                        key={s.id}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={s.tool === "highlighter" ? 1.2 : 0.35}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={s.tool === "highlighter" ? 0.45 : 1}
                        points={s.points
                          .map((p) => `${p.xNorm * 100},${p.yNorm * 100}`)
                          .join(" ")}
                      />
                    ))}
                  </svg>

                  {/* Shape draft */}
                  {shapeDraft && (
                    <div className="absolute border-2 border-dashed border-pd-brand bg-pd-brand/5"
                      style={{
                        left: `${Math.min(shapeDraft.startX, shapeDraft.endX) * 100}%`,
                        top: `${Math.min(shapeDraft.startY, shapeDraft.endY) * 100}%`,
                        width: `${Math.abs(shapeDraft.endX - shapeDraft.startX) * 100}%`,
                        height: `${Math.abs(shapeDraft.endY - shapeDraft.startY) * 100}%`,
                      }} />
                  )}

                  {/* Shapes */}
                  {pageShapes.map((item) => (
                    <div key={item.id}
                      className={cn("absolute cursor-move border-2 border-pd-brand",
                        selectedId === item.id && "ring-2 ring-pd-brand ring-offset-1")}
                      style={{
                        left: `${item.xNorm * 100}%`, top: `${item.yNorm * 100}%`,
                        width: `${item.widthNorm * 100}%`, height: `${item.heightNorm * 100}%`,
                      }}
                      onMouseDown={(e) => handleOverlayMouseDown(e, item.id, "shape", item.xNorm, item.yNorm)}
                    />
                  ))}

                  {/* Text overlays */}
                  {pageTexts.map((item) => {
                    const isNative = Boolean(item.nativeBlockId);
                    if (isNative && !item.isDirty) return null;

                    const fsPx = fontSizePtToPx(item.fontSize, canvasWidthPx);
                    const isSelected = selectedId === item.id;
                    const displayHNorm =
                      isNative && item.heightNorm
                        ? cappedLineHeightNorm(item.fontSize, item.heightNorm, currentPageHeightPt)
                        : item.heightNorm;
                    const singleLine = isNative && (item.singleLine ?? true);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "absolute cursor-move overflow-hidden",
                          isSelected && "ring-2 ring-pd-brand ring-offset-0 z-10",
                          isNative && "bg-white",
                          !isNative && textDecorationClass(item.decoration)
                        )}
                        style={{
                          left: `${item.xNorm * 100}%`,
                          top: `${item.yNorm * 100}%`,
                          width: item.widthNorm ? `${item.widthNorm * 100}%` : "auto",
                          maxHeight: displayHNorm ? `${displayHNorm * 100}%` : undefined,
                          fontSize: `${Math.max(7, fsPx)}px`,
                          lineHeight: singleLine ? 1 : 1.15,
                          fontFamily: fontCssFamily(item.fontId),
                          color: item.color,
                          fontWeight: item.bold ? 700 : 400,
                          fontStyle: item.italic ? "italic" : "normal",
                          textAlign: item.align,
                          padding: isNative ? 0 : undefined,
                        }}
                        onMouseDown={(e) =>
                          handleOverlayMouseDown(e, item.id, "text", item.xNorm, item.yNorm)
                        }
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingTextId(item.id);
                          setSelectedId(item.id);
                          setSelectedKind("text");
                        }}
                      >
                        {isNative && item.decoration !== "none" && (
                          <span
                            className={cn("pointer-events-none", textDecorationClass(item.decoration))}
                            aria-hidden
                          />
                        )}
                        {editingTextId === item.id ? (
                          <textarea
                            autoFocus
                            value={item.text}
                            onChange={(e) =>
                              setTextItems((prev) =>
                                prev.map((t) =>
                                  t.id === item.id
                                    ? { ...t, text: e.target.value, isDirty: true }
                                    : t
                                )
                              )
                            }
                            onBlur={() => setEditingTextId(null)}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "w-full resize-none border-0 bg-white outline-none",
                              singleLine && "whitespace-nowrap overflow-x-auto"
                            )}
                            style={{
                              fontSize: `${Math.max(7, fsPx)}px`,
                              lineHeight: singleLine ? 1 : 1.15,
                              fontFamily: fontCssFamily(item.fontId),
                              fontWeight: item.bold ? 700 : 400,
                              fontStyle: item.italic ? "italic" : "normal",
                              color: item.color,
                            }}
                            rows={singleLine ? 1 : Math.max(1, item.text.split("\n").length)}
                          />
                        ) : (
                          <span
                            className={cn(
                              "block",
                              singleLine ? "whitespace-nowrap overflow-hidden text-ellipsis" : "whitespace-pre-wrap break-words",
                              !isNative && textDecorationClass(item.decoration)
                            )}
                          >
                            {item.text}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Images */}
                  {pageImages.map((item) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={item.id} src={item.previewUrl} alt="" draggable={false}
                      className={cn("absolute cursor-move object-contain",
                        selectedId === item.id && "ring-2 ring-pd-brand ring-offset-1")}
                      style={{ left: `${item.xNorm * 100}%`, top: `${item.yNorm * 100}%`, width: `${item.widthNorm * 100}%` }}
                      onMouseDown={(e) => handleOverlayMouseDown(e, item.id, "image", item.xNorm, item.yNorm)}
                    />
                  ))}
                </div>
                </div>
              )}
            </div>

            {!loading && totalPages > 0 && (
              <div className="pointer-events-none sticky bottom-4 flex justify-center pb-4">
                <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#1f2937]/90 px-2 py-1.5 text-white shadow-lg">
                  <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}
                    className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="min-w-[4rem] text-center text-xs">{currentPage} / {totalPages}</span>
                  <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}
                    className="rounded-full p-1.5 hover:bg-white/10 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                  <div className="mx-1 h-4 w-px bg-white/20" />
                  <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="rounded-full p-1.5 hover:bg-white/10"><ZoomOut className="h-4 w-4" /></button>
                  <span className="min-w-[2.5rem] text-center text-xs">{Math.round(zoom * 100)}%</span>
                  <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="rounded-full p-1.5 hover:bg-white/10"><ZoomIn className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-pd-muted">
        <strong>Edit Text</strong> — click existing text blocks · <strong>T</strong> — add new text ·
        Draw / Shapes / Sign / Image in toolbar · Select text to change font, size, color, bold, decorations
      </p>
    </>
  );
}
