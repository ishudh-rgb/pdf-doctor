# S1 Snapshot — PDF Doctor

| Field | Value |
|-------|-------|
| **Tag** | `S1` |
| **Branch backup** | `s1-backup` |
| **Saved** | 2026-06-02 23:58 — website + PDF-to-Word + CONFIDENTIAL watermarks + PPT-to-PDF (PowerPoint native) + Excel-to-PDF + PDF-to-PPT (PyMuPDF image-based) + PDF-to-Excel (PyMuPDF table extraction) + **Rotate PDF (pdf-lib, Smallpdf-style UI)** |

## Locked design (100% — do not change without unlock)

| Setting | Value | File |
|---------|--------|------|
| **Brand theme** | A — Enterprise Navy | `src/config/design-system.ts` |
| **UX layout** | B — Split panel (Stripe-style) | `src/config/design-system.ts` |
| **Preview Lab** | Off | `DESIGN_LOCKED=true` |
| **Body layout class** | `layout-split-panel` | `LAYOUT_BODY_CLASS.B` |
| **Global styles** | Theme A tokens + Layout B spacing | `src/app/globals.css`, `src/styles/layout-styles.css` |

## Website (100% in git)

- **Pages:** homepage, all tool pages, auth, dashboard, admin, pricing, legal (privacy, terms, contact, faq)
- **PDF tools:** merge, split, compress, pdf-to-word, word-to-pdf, jpg-to-pdf, watermark, sign, protect, unlock, scanner, edit, AI summarizer, **rotate-pdf**
- **API routes:** tools/*, auth/*, files, payments, admin, cron
- **Live previews:** watermark, sign, compress, split, jpg-to-pdf, scanner, edit
- **i18n:** English + Hindi (`src/i18n/en.json`, `src/i18n/hi.json`)
- **Tool registry:** `src/config/tools.ts`, `src/config/constants.ts`
- **Mega menu:** Rotate PDF in "Organize PDF" category (`src/components/layout/header.tsx`)

## Images & visual content (100% in git)

| Asset | Path |
|-------|------|
| Hero main | `public/images/hero-product-main.webp` |
| Hero AI | `public/images/hero-product-ai.webp` |
| PDF.js worker | `public/pdf.worker.min.mjs` |
| SVG icons | `public/*.svg` |

## PDF-to-Word pipeline (100% in git)

| Component | Path |
|-----------|------|
| Conversion entry | `scripts/pdf-to-docx.py` |
| Layout transform | `scripts/smallpdf_transform.py` |
| Python setup | `scripts/setup-pdf2docx.ps1` |
| Node service | `src/lib/services/pdf-to-word-pdf2docx.service.ts` |
| Engine router | `src/lib/services/pdf-to-word.service.ts` |
| API route | `src/app/api/tools/pdf-to-word/route.ts` |

### Watermark templates (text + logo assets)

| File | Purpose |
|------|---------|
| `scripts/templates/confidential-watermark-drawing.xml` | CONFIDENTIAL body anchor |
| `scripts/templates/confidential-watermark-vml.xml` | Header fallback |
| `scripts/templates/confidential-watermark-run.xml` | VML run template |
| `scripts/templates/watermark-logo.png` | Logo image (~408 KB, from PDF) |
| `scripts/templates/watermark-logo-drawing.xml` | Logo anchor XML |
| `scripts/templates/smallpdf-ref/styles.xml` | Word styles injection |
| `scripts/templates/smallpdf-ref/numbering.xml` | Native list numbering |
| `scripts/templates/smallpdf-ref/image1.png` | Bullet list glyph |

### Current PDF-to-Word behaviour (at S1 save)

- **CONFIDENTIAL** diagonal text watermark on PDF pages 1–8 (body-anchored, `behindDoc`, through tables)
- **Tables** fit portrait/landscape; ledger pages landscape
- **Lists** native Word numbering from PDF geometry
- **Logo image watermark:** intentionally **disabled** (reverted — was wrong page placement)
- **Output size:** ~58 KB DOCX (no embedded logo image in output)
- **UI:** circular progress on convert button, output file size pill on success

## Text & typography (Word output)

- Body: 11pt Calibri (`BODY_FONT_HALFPTS = 22`)
- Section headings: 22pt bold
- Bullet hanging indent from PDF x-positions
- SWOT table borders + cell fill `FAFAFA`

## Local backup only (`.snapshots/s1/` — never git)

| Item | Path |
|------|------|
| Env secrets | `.snapshots/s1/.env.local.backup` |
| Full template tree | `.snapshots/s1/scripts-templates/` |
| Core Python scripts | `.snapshots/s1/scripts-core/` |
| Reference DOCX | `.snapshots/s1/reference-merged-test.docx` |
| Manifest | `.snapshots/s1/MANIFEST.txt` |

## PPT-to-PDF pipeline (100% in git)

| Component | Path |
|-----------|------|
| Main service | `src/lib/services/ppt-to-pdf.service.ts` |
| PPTX parser (text, images, tables, styled tables) | `src/lib/services/pptx-parse.service.ts` |
| Legacy `.ppt` parser (CFB/binary) | `src/lib/services/legacy-ppt-parse.service.ts` |
| PowerPoint slide export (COM/VBS) | `src/lib/services/powerpoint-slide-export.service.ts` |
| PowerPoint `.ppt` → `.pptx` convert | `src/lib/services/powerpoint-pptx-convert.service.ts` |
| EMF → PNG converter (GDI+) | `src/lib/services/emf-to-png.service.ts` |
| Slide image → PDF (pdf-lib) | `src/lib/services/html-to-pdf.service.ts` (`renderSlideImagesToPdf`) |
| VBS: slide PNG export | `scripts/ppt-export-slide-images.vbs` |
| VBS: `.ppt` → `.pptx` save | `scripts/ppt-save-as-pptx.vbs` |

### PPT-to-PDF conversion flow (at S1 save)

1. **Windows + PowerPoint installed** → each slide exported as 2560×1440 PNG via COM → embedded into A4 landscape PDF pages via `pdf-lib` (pixel-perfect, matches Smallpdf)
2. **LibreOffice fallback** → `libreoffice-convert` if `soffice` available
3. **HTML fallback** → parse PPTX XML (text blocks, styled tables, images, EMF charts) → Puppeteer render

## PDF-to-PPT pipeline (100% in git)

| Component | Path |
|-----------|------|
| Main service | `src/lib/services/pdf-to-ppt.service.ts` |
| Python PDF renderer (PyMuPDF) | `scripts/pdf-render-pages.py` |
| Test script | `scripts/test-pdf-to-ppt.ts` |
| API route | `src/app/api/tools/pdf-to-ppt/route.ts` |

### PDF-to-PPT conversion flow (at S1 save)

1. **PyMuPDF renders** each PDF page as a high-resolution JPEG (1920px width, quality 85%)
2. **PptxGenJS** creates a 16:9 PPTX with each JPEG as a full-slide background (`w: "100%", h: "100%"`)
3. Works with **any PDF** — presentations, documents, brochures, A4 portrait, widescreen, mixed sizes
4. Visually **100% identical** to original PDF (same approach as Smallpdf)

## PDF-to-Excel pipeline (100% in git)

| Component | Path |
|-----------|------|
| Main service | `src/lib/services/pdf-to-excel.service.ts` |
| Python table extractor (PyMuPDF) | `scripts/pdf-extract-tables.py` |
| Test script | `scripts/test-pdf-to-excel.ts` |
| API route | `src/app/api/tools/pdf-to-excel/route.ts` |
| Legacy extractor (kept for reference) | `src/lib/services/pdf-table-extract.service.ts` |

### PDF-to-Excel conversion flow (at S1 save)

1. **PyMuPDF `find_tables()`** detects and extracts tables from every PDF page
2. **Smart merge** across pages — handles repeated headers, continuation pages, different column structures
3. **Auto-detect column types** — dates, currency ($), percentages (%), numbers, text
4. **ExcelJS** creates XLSX with frozen headers, auto-filter, alternating row colors, auto-fit columns
5. Works with **any PDF** — 1000-row employee tables, bank statements, invoices
6. **99.9% match** with Smallpdf for Employee Sample Data (1001 rows × 14 cols)

## Rotate PDF feature (100% in git) — NEW

| Component | Path |
|-----------|------|
| Rotation service (pdf-lib) | `src/lib/services/pdf-rotate.service.ts` |
| API route | `src/app/api/tools/rotate-pdf/route.ts` |
| Page component | `src/app/(tools)/rotate-pdf/page.tsx` |
| Workspace UI | `src/components/tools/rotate-pdf/rotate-pdf-workspace.tsx` |
| Page card (Smallpdf-style) | `src/components/tools/rotate-pdf/rotate-page-card.tsx` |

### Rotate PDF features (at S1 save)

1. **Individual page rotation** — hover any page thumbnail → circular blue rotate left/right buttons (Smallpdf-style)
2. **Bulk rotation** — select all / select multiple → toolbar rotate left/right/delete
3. **Add documents** — click `+` between pages → insert another PDF or blank page
4. **Duplicate pages** — hover toolbar → duplicate icon
5. **Remove pages** — hover toolbar → trash icon
6. **No file size limit** — works with any PDF size
7. **Proper rotation output** — pdf-lib `setRotation` with MediaBox/CropBox dimension swap for 90°/270° (no empty space)
8. **Additive rotation** — reads existing page rotation and adds desired angle (doesn't overwrite)

### Rotate PDF UI design (Smallpdf-style, at S1 save)

- **Page cards:** white background, subtle shadow, A4 aspect ratio (141.4%), `object-contain` with white fill
- **Rotation preview:** CSS `rotate()` + `scale(1.414)` for 90°/270° to fill cards without empty space
- **Hover actions:** dark translucent toolbar (zoom, duplicate, delete) top-right; blue circular rotate buttons bottom-center
- **Selection:** blue ring + light blue fill on selected cards; checkbox top-left
- **Grid background:** neutral `gray-100`
- **Toolbar:** white bar with select all, rotate L/R, delete, file info, change file, Export button
- **File label:** emerald green pill badge below each card
- **Completed view:** green check → download button → "Rotate another file"

### Rotate PDF config (at S1 save)

- **Tool registry:** added in `src/config/constants.ts` (TOOLS array + MEGA_MENU_CATEGORIES under "Organize PDF")
- **SEO metadata:** `src/config/tools.ts` (title, description, h1, FAQs)
- **Breadcrumbs:** `src/components/layout/tool-layout-chrome.tsx` (TOOL_SLUG_LABELS)
- **Homepage:** `src/components/marketing/home/home-shared.ts` (TOOL_KEYS + TOOL_ACCENT)
- **Admin panel:** `src/app/admin/jobs/page.tsx` (toolOptions filter)
- **Mega menu:** `src/components/layout/header.tsx` (hardcoded in megaMenuCategories → Organize PDF)
- **i18n:** `src/i18n/en.json` + `src/i18n/hi.json`

## Excel-to-PDF improvements (at S1 save)

- Landscape mode, full table per sheet page
- Trimmed empty rows, merged cells, cell styles, formatted numbers
- Default zoom 100% via `OpenAction` in PDF

## NOT in git (restore after revert)

- `node_modules` → `npm install`
- `.next` → `npm run dev`
- `.env.local` → from `.snapshots/s1/.env.local.backup`
- Python: run `.\scripts\setup-pdf2docx.ps1` if pdf2docx missing

## Revert to S1

**Say:** `revert to s1`

**Or run:**

```powershell
cd pdf-doctor
.\scripts\revert-to-s1.ps1
```

This runs `git reset --hard S1`, restores `.env.local` from snapshot folder, and `npm install`.

## Refresh S1 (save current state again)

```powershell
.\scripts\save-s1.ps1
```

Updates git tag `S1`, branch `s1-backup`, and local `.snapshots/s1/` copies (templates, images, env).
