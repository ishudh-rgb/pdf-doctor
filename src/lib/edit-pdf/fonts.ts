/** Display fonts (Smallpdf-style list) mapped to pdf-lib StandardFonts keys. */
export type PdfFontKey =
  | "Helvetica"
  | "Helvetica-Bold"
  | "Helvetica-Oblique"
  | "Helvetica-BoldOblique"
  | "Times-Roman"
  | "Times-Bold"
  | "Times-Italic"
  | "Times-BoldItalic"
  | "Courier"
  | "Courier-Bold"
  | "Courier-Oblique"
  | "Courier-BoldOblique";

export interface EditPdfFontOption {
  id: string;
  label: string;
  cssFamily: string;
  pdfFont: PdfFontKey;
  pdfFontBold: PdfFontKey;
  pdfFontItalic: PdfFontKey;
  pdfFontBoldItalic: PdfFontKey;
}

export const EDIT_PDF_FONTS: EditPdfFontOption[] = [
  {
    id: "calibri",
    label: "Calibri",
    cssFamily: "Calibri, 'Segoe UI', sans-serif",
    pdfFont: "Helvetica",
    pdfFontBold: "Helvetica-Bold",
    pdfFontItalic: "Helvetica-Oblique",
    pdfFontBoldItalic: "Helvetica-BoldOblique",
  },
  {
    id: "arial",
    label: "Arial",
    cssFamily: "Arial, Helvetica, sans-serif",
    pdfFont: "Helvetica",
    pdfFontBold: "Helvetica-Bold",
    pdfFontItalic: "Helvetica-Oblique",
    pdfFontBoldItalic: "Helvetica-BoldOblique",
  },
  {
    id: "helvetica",
    label: "Helvetica",
    cssFamily: "Helvetica, Arial, sans-serif",
    pdfFont: "Helvetica",
    pdfFontBold: "Helvetica-Bold",
    pdfFontItalic: "Helvetica-Oblique",
    pdfFontBoldItalic: "Helvetica-BoldOblique",
  },
  {
    id: "times",
    label: "Times New Roman",
    cssFamily: "'Times New Roman', Times, serif",
    pdfFont: "Times-Roman",
    pdfFontBold: "Times-Bold",
    pdfFontItalic: "Times-Italic",
    pdfFontBoldItalic: "Times-BoldItalic",
  },
  {
    id: "courier",
    label: "Courier New",
    cssFamily: "'Courier New', Courier, monospace",
    pdfFont: "Courier",
    pdfFontBold: "Courier-Bold",
    pdfFontItalic: "Courier-Oblique",
    pdfFontBoldItalic: "Courier-BoldOblique",
  },
  {
    id: "georgia",
    label: "Georgia",
    cssFamily: "Georgia, 'Times New Roman', serif",
    pdfFont: "Times-Roman",
    pdfFontBold: "Times-Bold",
    pdfFontItalic: "Times-Italic",
    pdfFontBoldItalic: "Times-BoldItalic",
  },
  {
    id: "verdana",
    label: "Verdana",
    cssFamily: "Verdana, Geneva, sans-serif",
    pdfFont: "Helvetica",
    pdfFontBold: "Helvetica-Bold",
    pdfFontItalic: "Helvetica-Oblique",
    pdfFontBoldItalic: "Helvetica-BoldOblique",
  },
  {
    id: "tahoma",
    label: "Tahoma",
    cssFamily: "Tahoma, Geneva, sans-serif",
    pdfFont: "Helvetica",
    pdfFontBold: "Helvetica-Bold",
    pdfFontItalic: "Helvetica-Oblique",
    pdfFontBoldItalic: "Helvetica-BoldOblique",
  },
  {
    id: "trebuchet",
    label: "Trebuchet MS",
    cssFamily: "'Trebuchet MS', Helvetica, sans-serif",
    pdfFont: "Helvetica",
    pdfFontBold: "Helvetica-Bold",
    pdfFontItalic: "Helvetica-Oblique",
    pdfFontBoldItalic: "Helvetica-BoldOblique",
  },
  {
    id: "comic",
    label: "Comic Sans MS",
    cssFamily: "'Comic Sans MS', cursive, sans-serif",
    pdfFont: "Helvetica",
    pdfFontBold: "Helvetica-Bold",
    pdfFontItalic: "Helvetica-Oblique",
    pdfFontBoldItalic: "Helvetica-BoldOblique",
  },
  {
    id: "impact",
    label: "Impact",
    cssFamily: "Impact, Haettenschweiler, sans-serif",
    pdfFont: "Helvetica-Bold",
    pdfFontBold: "Helvetica-Bold",
    pdfFontItalic: "Helvetica-BoldOblique",
    pdfFontBoldItalic: "Helvetica-BoldOblique",
  },
];

export const EDIT_PDF_FONT_SIZES = [
  8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 48, 72,
];

export const EDIT_PDF_COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#FFFFFF",
  "#FF0000",
  "#FF9900",
  "#FFFF00",
  "#00FF00",
  "#00FFFF",
  "#0000FF",
  "#9900FF",
  "#FF00FF",
  "#E06666",
  "#F6B26B",
  "#FFD966",
  "#93C47D",
  "#76A5AF",
  "#6D9EEB",
  "#8E7CC3",
];

export function resolvePdfFontKey(
  fontId: string,
  bold: boolean,
  italic: boolean
): PdfFontKey {
  const font = EDIT_PDF_FONTS.find((f) => f.id === fontId) ?? EDIT_PDF_FONTS[0];
  if (bold && italic) return font.pdfFontBoldItalic;
  if (bold) return font.pdfFontBold;
  if (italic) return font.pdfFontItalic;
  return font.pdfFont;
}

export function fontCssFamily(fontId: string): string {
  return EDIT_PDF_FONTS.find((f) => f.id === fontId)?.cssFamily ?? EDIT_PDF_FONTS[0].cssFamily;
}

/** Map PDF embedded font name → UI font id (Smallpdf-style labels). */
export function fontIdFromPdfName(fontName: string): string {
  const n = fontName.toLowerCase();
  if (n.includes("calibri")) return "calibri";
  if (n.includes("arial")) return "arial";
  if (n.includes("times") || n.includes("roman")) return "times";
  if (n.includes("courier")) return "courier";
  if (n.includes("georgia")) return "georgia";
  if (n.includes("verdana")) return "verdana";
  if (n.includes("tahoma")) return "tahoma";
  if (n.includes("trebuchet")) return "trebuchet";
  if (n.includes("comic")) return "comic";
  if (n.includes("impact")) return "impact";
  if (n.includes("helvetica") || n.includes("arial")) return "arial";
  return "calibri";
}

export function isItalicPdfFont(fontName: string): boolean {
  return /italic|oblique/i.test(fontName);
}
