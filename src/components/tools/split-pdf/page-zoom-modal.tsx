"use client";

import { X } from "lucide-react";

interface PageZoomModalProps {
  pageNum: number;
  imageUrl?: string;
  rotation: number;
  onClose: () => void;
}

export function PageZoomModal({ pageNum, imageUrl, rotation, onClose }: PageZoomModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal
      aria-label={`Page ${pageNum} preview`}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-4xl rounded-xl bg-white p-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-pd-foreground text-white shadow-lg"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="mb-2 text-center text-sm font-semibold text-pd-foreground">Page {pageNum}</p>
        <div className="max-h-[80vh] overflow-auto">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Page ${pageNum}`}
              className="mx-auto max-h-[75vh] w-auto object-contain"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          ) : (
            <p className="px-8 py-12 text-pd-muted">Preview not available</p>
          )}
        </div>
      </div>
    </div>
  );
}
