# S1 Snapshot — PDF Doctor (Only4PDF)

| Field | Value |
|-------|-------|
| **Tag** | `S1` |
| **Branch backup** | `s1-backup` |
| **Saved** | 2026-06-12 — full website + **PDF-to-Word v2** (job polling, live progress, drawing-heavy fast path) + Sign PDF + Hero variants + all tools |

## Locked design (100% — do not change without unlock)

| Setting | Value | File |
|---------|--------|------|
| **Brand theme** | A — Enterprise Navy | `src/config/design-system.ts` |
| **UX layout** | B — Split panel (Stripe-style) | `src/config/design-system.ts` |
| **Preview Lab** | Off | `DESIGN_LOCKED=true` |
| **Body layout class** | `layout-split-panel` | `LAYOUT_BODY_CLASS.B` |
| **Global styles** | Theme A tokens + Layout B spacing | `src/app/globals.css`, `src/styles/layout-styles.css` |
| **Hero variant config** | `src/config/hero-variant.ts` | v1 / v2 / v2-d1 / v2-d2 switch |

## Website (100% in git)

- **Pages:** homepage, all tool pages, auth, dashboard, admin, pricing, legal (privacy, terms, contact, faq, about)
- **PDF tools:** merge, split, compress, pdf-to-word, word-to-pdf, jpg-to-pdf, watermark, sign, protect, unlock, scanner, edit, AI summarizer, rotate-pdf, delete-pdf, extract-pdf, html-to-pdf, excel-to-pdf, ppt-to-pdf, pdf-to-ppt, pdf-to-excel
- **API routes:** tools/*, auth/*, files, payments, admin, cron
- **Live previews:** watermark, sign, compress, split, jpg-to-pdf, scanner, edit
- **i18n:** English + Hindi (`src/i18n/en.json`, `src/i18n/hi.json`)
- **Tool registry:** `src/config/tools.ts`, `src/config/constants.ts`

## Images & visual content

| Asset | Path |
|-------|------|
| Hero visuals | `src/components/marketing/hero-visual-v1.tsx`, `hero-visual-v2.tsx`, `hero-visual-v2-d1.tsx`, `hero-visual-v2-d2.tsx` |
| Hero variant switch | `src/components/marketing/hero-variant-provider.tsx`, `hero-variant-switch.tsx` |
| PDF.js worker | `public/pdf.worker.min.mjs` |
| SVG icons | `public/*.svg` |
| Watermark logo | `scripts/templates/watermark-logo.png` |

## PDF-to-Word pipeline v2 (100% in git) — CURRENT STAGE

| Component | Path |
|-----------|------|
| Python conversion | `scripts/pdf-to-docx.py` |
| Layout transform | `scripts/smallpdf_transform.py` |
| Python setup | `scripts/setup-pdf2docx.ps1` |
| pdf2docx spawn service | `src/lib/services/pdf-to-word-pdf2docx.service.ts` |
| Job store (in-memory) | `src/lib/services/pdf-to-word-jobs.service.ts` |
| Engine router | `src/lib/services/pdf-to-word.service.ts` |
| ConvertAPI (optional) | `src/lib/services/pdf-to-word-convertapi.service.ts` |
| Node fallback | `src/lib/services/pdf-to-word-node.service.ts` |
| POST API (job + direct) | `src/app/api/tools/pdf-to-word/route.ts` |
| Status polling API | `src/app/api/tools/pdf-to-word/status/route.ts` |
| Binary download API | `src/app/api/tools/pdf-to-word/download/route.ts` |
| Dedicated UI page | `src/components/tools/pdf-to-word-tool-page.tsx` |
| Tool route | `src/app/(tools)/pdf-to-word/page.tsx` |

### PDF-to-Word behaviour (at this S1 save)

- **Engine priority:** ConvertAPI (if `CONVERTAPI_SECRET`) → pdf2docx → Node extractor
- **Job-based conversion:** client POST with `X-Pdf-To-Word-Job: 1` → poll status every 400ms → binary download (no base64)
- **Live progress:** Python emits `PROGRESS pct=N` on stderr; phase logs `[1/4]`–`[4/4]` + page logs + heartbeat during long analyze
- **Windows fix:** `multi_processing` disabled on `win32` (pool workers hang on cv2 import)
- **Drawing-heavy PDFs:** auto-detect (600+ vector paths/page) → fast image render path (~30s for 38-page vector PDFs)
- **Text PDFs:** normal pdf2docx path (~2–30s depending on pages)
- **CONFIDENTIAL Founder PDFs:** `smallpdf_transform.py` watermarks + tables + native lists (unchanged)
- **UI:** circular progress meter, OCR info banner for scanned PDFs, file size on success

### Watermark templates (text + logo assets)

| File | Purpose |
|------|---------|
| `scripts/templates/confidential-watermark-drawing.xml` | CONFIDENTIAL body anchor |
| `scripts/templates/confidential-watermark-vml.xml` | Header fallback |
| `scripts/templates/confidential-watermark-run.xml` | VML run template |
| `scripts/templates/watermark-logo.png` | Logo image |
| `scripts/templates/watermark-logo-drawing.xml` | Logo anchor XML |
| `scripts/templates/smallpdf-ref/styles.xml` | Word styles injection |
| `scripts/templates/smallpdf-ref/numbering.xml` | Native list numbering |
| `scripts/templates/smallpdf-ref/image1.png` | Bullet list glyph |

## Sign PDF (100% in git)

| Component | Path |
|-----------|------|
| Workspace UI | `src/components/tools/sign-pdf/sign-pdf-workspace.tsx` |
| Signature modal | `src/components/tools/sign-pdf/signature-create-modal.tsx` |
| Annotations | image, text, date, check types |
| Page route | `src/app/(tools)/sign-pdf/page.tsx` |

## Other pipelines (unchanged from prior S1)

- **PPT-to-PDF:** PowerPoint COM slide export + pdf-lib (`src/lib/services/ppt-to-pdf.service.ts`)
- **PDF-to-PPT:** PyMuPDF render + PptxGenJS (`src/lib/services/pdf-to-ppt.service.ts`)
- **PDF-to-Excel:** PyMuPDF find_tables + ExcelJS (`src/lib/services/pdf-to-excel.service.ts`)
- **HTML-to-PDF:** Puppeteer (`src/lib/services/html-to-pdf-convert.service.ts`) — **not modified in PDF-to-Word work**
- **Organize PDF:** rotate, delete, extract with Smallpdf-style workspaces + PageZoomModal

## Local backup only (`.snapshots/s1/` — never git)

| Item | Path |
|------|------|
| Env secrets | `.snapshots/s1/.env.local.backup` |
| Full template tree | `.snapshots/s1/scripts-templates/` |
| Core Python scripts | `.snapshots/s1/scripts-core/` |
| PDF-to-Word TS mirror | `.snapshots/s1/pdf-to-word-src/` |
| Public assets mirror | `.snapshots/s1/public/` |
| Reference DOCX | `.snapshots/s1/reference-merged-test.docx` |
| Manifest | `.snapshots/s1/MANIFEST.txt` |
| This doc copy | `.snapshots/s1/S1-SNAPSHOT.md` |

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

## Refresh S1 (save current state again)

```powershell
.\scripts\save-s1.ps1
```

Updates git tag `S1`, branch `s1-backup`, and local `.snapshots/s1/` copies.
