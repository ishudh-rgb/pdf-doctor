import type { PdfFontKey } from "@/lib/edit-pdf/fonts";

export type EditTool =
  | "select"
  | "hand"
  | "edit-text"
  | "add-text"
  | "draw-pencil"
  | "draw-highlighter"
  | "draw-eraser"
  | "shape-rect"
  | "image"
  | "sign";

export type TextDecoration = "none" | "highlight" | "underline" | "strikethrough" | "squiggle";
export type TextAlign = "left" | "center" | "right";

export interface TextStyle {
  fontId: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: TextAlign;
  decoration: TextDecoration;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontId: "calibri",
  fontSize: 11,
  color: "#000000",
  bold: false,
  italic: false,
  align: "left",
  decoration: "none",
};

export interface EditTextItem extends TextStyle {
  id: string;
  text: string;
  page: number;
  xNorm: number;
  yNorm: number;
  widthNorm?: number;
  heightNorm?: number;
  singleLine?: boolean;
  /** True after user edits — whiteout/overlay only then (preserves original on click). */
  isDirty?: boolean;
  /** Existing PDF text block being edited */
  nativeBlockId?: string;
}

export interface EditImageItem {
  id: string;
  file: File;
  previewUrl: string;
  page: number;
  xNorm: number;
  yNorm: number;
  widthNorm: number;
  heightNorm: number;
}

export interface EditShapeItem {
  id: string;
  page: number;
  xNorm: number;
  yNorm: number;
  widthNorm: number;
  heightNorm: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
}

export interface DrawPoint {
  xNorm: number;
  yNorm: number;
}

export interface DrawStroke {
  id: string;
  page: number;
  points: DrawPoint[];
  color: string;
  widthNorm: number;
  tool: "pencil" | "highlighter";
}

export interface ExportTextOp {
  text: string;
  x: number;
  y: number;
  page: number;
  fontSize: number;
  color?: string;
  fontKey?: PdfFontKey;
  decoration?: TextDecoration;
  align?: TextAlign;
  boxWidth?: number;
  whiteout?: { x: number; y: number; width: number; height: number };
}

export interface ExportImageOp {
  imageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface ExportShapeOp {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
}

export interface ExportStrokeOp {
  page: number;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  opacity: number;
}

export interface EditExportPayload {
  texts: ExportTextOp[];
  images: ExportImageOp[];
  shapes: ExportShapeOp[];
  strokes: ExportStrokeOp[];
}
