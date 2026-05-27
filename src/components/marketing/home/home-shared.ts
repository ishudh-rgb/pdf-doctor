import {
  Layers,
  Scissors,
  Minimize2,
  FileText,
  FileUp,
  Image as ImageIcon,
  Pencil,
  PenTool,
  Sparkles,
  ScanLine,
  Unlock,
  Lock,
  Table,
  Presentation,
  FileSpreadsheet,
  Stamp,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  Layers,
  Scissors,
  Minimize2,
  FileText,
  FileUp,
  Image: ImageIcon,
  Pencil,
  PenTool,
  Sparkles,
  ScanLine,
  Unlock,
  Lock,
  Table,
  Presentation,
  FileSpreadsheet,
  Stamp,
};

export const TOOL_KEYS = [
  { slug: "merge-pdf", icon: "Layers", nameKey: "tools.mergePdf.name", descKey: "tools.mergePdf.description", category: "organize" },
  { slug: "split-pdf", icon: "Scissors", nameKey: "tools.splitPdf.name", descKey: "tools.splitPdf.description", category: "organize" },
  { slug: "compress-pdf", icon: "Minimize2", nameKey: "tools.compressPdf.name", descKey: "tools.compressPdf.description", category: "optimize" },
  { slug: "pdf-to-word", icon: "FileText", nameKey: "tools.pdfToWord.name", descKey: "tools.pdfToWord.description", category: "convert-from" },
  { slug: "pdf-to-excel", icon: "Table", nameKey: "tools.pdfToExcel.name", descKey: "tools.pdfToExcel.description", category: "convert-from" },
  { slug: "pdf-to-ppt", icon: "Presentation", nameKey: "tools.pdfToPpt.name", descKey: "tools.pdfToPpt.description", category: "convert-from" },
  { slug: "word-to-pdf", icon: "FileUp", nameKey: "tools.wordToPdf.name", descKey: "tools.wordToPdf.description", category: "convert-to" },
  { slug: "excel-to-pdf", icon: "FileSpreadsheet", nameKey: "tools.excelToPdf.name", descKey: "tools.excelToPdf.description", category: "convert-to" },
  { slug: "ppt-to-pdf", icon: "Presentation", nameKey: "tools.pptToPdf.name", descKey: "tools.pptToPdf.description", category: "convert-to" },
  { slug: "jpg-to-pdf", icon: "Image", nameKey: "tools.jpgToPdf.name", descKey: "tools.jpgToPdf.description", category: "convert-to" },
  { slug: "edit-pdf", icon: "Pencil", nameKey: "tools.editPdf.name", descKey: "tools.editPdf.description", category: "edit", isPro: true },
  { slug: "sign-pdf", icon: "PenTool", nameKey: "tools.signPdf.name", descKey: "tools.signPdf.description", category: "edit", isPro: true },
  { slug: "add-watermark", icon: "Stamp", nameKey: "tools.addWatermark.name", descKey: "tools.addWatermark.description", category: "edit" },
  { slug: "ai-pdf-summarizer", icon: "Sparkles", nameKey: "tools.aiPdfSummarizer.name", descKey: "tools.aiPdfSummarizer.description", category: "ai", isPro: true },
  { slug: "pdf-scanner", icon: "ScanLine", nameKey: "tools.pdfScanner.name", descKey: "tools.pdfScanner.description", category: "scan" },
  { slug: "unlock-pdf", icon: "Unlock", nameKey: "tools.unlockPdf.name", descKey: "tools.unlockPdf.description", category: "security" },
  { slug: "protect-pdf", icon: "Lock", nameKey: "tools.protectPdf.name", descKey: "tools.protectPdf.description", category: "security" },
] as const;

export const FAQ_KEYS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6", "faq7"] as const;

export const FREE_FEATURES = [
  "5 tool uses per day",
  "Max 25 MB file size",
  "Basic PDF tools",
  "Standard processing speed",
  "Files deleted after 2 hours",
];

export const PRO_FEATURES = [
  "100 tool uses per day",
  "Max 200 MB file size",
  "All PDF tools including Edit & Sign",
  "AI PDF Summarizer",
  "Priority processing",
  "No ads",
  "Batch processing",
];

export const TOOL_CATEGORIES = [
  { id: "organize", labelKey: "landing.toolsCategoryOrganize" },
  { id: "optimize", labelKey: "landing.toolsCategoryOptimize" },
  { id: "convert-from", labelKey: "landing.toolsCategoryConvertFrom" },
  { id: "convert-to", labelKey: "landing.toolsCategoryConvertTo" },
  { id: "edit", labelKey: "landing.toolsCategoryEdit" },
  { id: "security", labelKey: "landing.toolsCategorySecurity" },
  { id: "ai", labelKey: "landing.toolsCategoryAi" },
  { id: "scan", labelKey: "landing.toolsCategoryScan" },
] as const;

export const CATEGORY_FALLBACK_LABELS: Record<string, string> = {
  organize: "Organize PDF",
  optimize: "Optimize PDF",
  "convert-from": "Convert from PDF",
  "convert-to": "Convert to PDF",
  edit: "Edit & Sign",
  security: "Security",
  ai: "AI Tools",
  scan: "Scan",
};
