# S1 Snapshot — PDF Doctor (Only4PDF)

| Field | Value |
|-------|-------|
| **Tag** | `S1` |
| **Branch backup** | `s1-backup` |
| **Saved** | 2026-06-13 — PDF-to-Word v3: chunked mega-PDF, password unlock, disk jobs, encrypted PDF repair + all tools |

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

## PDF-to-Word pipeline v3 (100% in git) — CURRENT STAGE

| Component | Path |
|-----------|------|
| Python conversion | `scripts/pdf-to-docx.py` |
| Chunk range worker | `scripts/pdf-to-docx-range.py` |
| Layout transform | `scripts/smallpdf_transform.py` |
| Python setup | `scripts/setup-pdf2docx.ps1` |
| pdf2docx spawn service | `src/lib/services/pdf-to-word-pdf2docx.service.ts` |
| Job store (disk output) | `src/lib/services/pdf-to-word-jobs.service.ts` |
| Engine router | `src/lib/services/pdf-to-word.service.ts` |
| Password helper | `src/lib/pdf/pdf-password.server.ts` |
| ConvertAPI (optional) | `src/lib/services/pdf-to-word-convertapi.service.ts` |
| Node fallback | `src/lib/services/pdf-to-word-node.service.ts` |
| POST API (job + direct) | `src/app/api/tools/pdf-to-word/route.ts` |
| Status polling API | `src/app/api/tools/pdf-to-word/status/route.ts` |
| Binary download API (stream) | `src/app/api/tools/pdf-to-word/download/route.ts` |
| Dedicated UI + password modal | `src/components/tools/pdf-to-word-tool-page.tsx` |
| Tool route | `src/app/(tools)/pdf-to-word/page.tsx` |

### PDF-to-Word behaviour (at this S1 save)

- **Engine priority:** ConvertAPI (if `CONVERTAPI_SECRET`) → pdf2docx → Node extractor (Node skipped for 8MB+ files)
- **Job-based conversion:** disk temp files, stream download, no base64 / no full DOCX in Node heap
- **Live progress:** `PROGRESS pct=N`, phase logs, heartbeat, per-chunk updates for large PDFs
- **Windows fix:** no pdf2docx multiprocessing on win32; chunk workers via subprocess + ThreadPool
- **Mega PDFs (400+ pages):** 100-page chunks, parallel subprocess workers, DOCX merge, up to 30 min timeout
- **Drawing-heavy PDFs (≤150 pages):** fast image render path
- **Password-protected PDFs:** `resolvePdfBuffer` + `PdfPasswordModal` + Python `prepare_input_pdf` decrypt/repair
- **Encrypted error handling:** friendly messages for `document closed or encrypted`
- **CONFIDENTIAL Founder PDFs:** `smallpdf_transform.py` watermarks (unchanged)
- **UI:** progress meter, password modal, OCR info banner, file size on success

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
