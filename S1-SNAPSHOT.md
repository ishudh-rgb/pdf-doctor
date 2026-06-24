# S1 Snapshot — Only4PDF (PDF Doctor)

| Field | Value |
|-------|-------|
| **Tag** | `S1` |
| **Branch backup** | `s1-backup` |
| **Saved** | 2026-06-05 — OnlyMyPDF (Logo D lock), dashboard + pricing redesign, PDF Scanner workspace, user files API, AI Summarizer polish |

---

## Locked design (100% — do not change without unlock)

| Setting | Value | File |
|---------|--------|------|
| **Brand theme** | A — Enterprise Navy | `src/config/design-system.ts` |
| **UX layout** | B — Split panel (Stripe-style) | `src/config/design-system.ts` |
| **Brand name** | OnlyMyPDF | `src/config/constants.ts`, `src/config/brand.ts` |
| **Logo** | D — Stacked gradient (locked) | `src/config/brand-logos.ts` |
| **Preview Lab** | Off | `DESIGN_LOCKED=true`, logo preview disabled |
| **Body layout class** | `layout-split-panel` | `LAYOUT_BODY_CLASS.B` |
| **Global styles** | Theme A tokens + Layout B spacing | `src/app/globals.css`, `src/styles/layout-styles.css` |
| **Hero variant config** | `src/config/hero-variant.ts` | v1 / v2 / v2-d1 / v2-d2 switch |

---

## All pages (46 — 100% in git)

### Marketing & public (9)

| Route | File |
|-------|------|
| `/` | `src/app/page.tsx` |
| `/convert` | `src/app/convert/page.tsx` |
| `/all-tools` | `src/app/all-tools/page.tsx` |
| `/about` | `src/app/about/page.tsx` |
| `/pricing` | `src/app/pricing/page.tsx` |
| `/privacy` | `src/app/privacy/page.tsx` |
| `/terms` | `src/app/terms/page.tsx` |
| `/contact` | `src/app/contact/page.tsx` |
| `/faq` | `src/app/faq/page.tsx` |

### Auth (4)

| Route | File |
|-------|------|
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/signup` | `src/app/(auth)/signup/page.tsx` |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` |

### Dashboard (4)

| Route | File |
|-------|------|
| `/dashboard` | `src/app/dashboard/page.tsx` |
| `/dashboard/files` | `src/app/dashboard/files/page.tsx` |
| `/dashboard/pricing` | `src/app/dashboard/pricing/page.tsx` |
| Layout wrapper | `src/app/dashboard/layout.tsx` |

### Admin (9)

| Route | File |
|-------|------|
| `/admin` | `src/app/admin/page.tsx` |
| `/admin/jobs` | `src/app/admin/jobs/page.tsx` |
| `/admin/settings` | `src/app/admin/settings/page.tsx` |
| `/admin/coupons` | `src/app/admin/coupons/page.tsx` |
| `/admin/users` | `src/app/admin/users/page.tsx` |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` |
| `/admin/cleanup` | `src/app/admin/cleanup/page.tsx` |
| `/admin/payments` | `src/app/admin/payments/page.tsx` |
| `/admin/errors` | `src/app/admin/errors/page.tsx` |

### PDF tools (22)

| Route | Slug | File |
|-------|------|------|
| `/merge-pdf` | merge-pdf | `src/app/(tools)/merge-pdf/page.tsx` |
| `/split-pdf` | split-pdf | `src/app/(tools)/split-pdf/page.tsx` |
| `/rotate-pdf` | rotate-pdf | `src/app/(tools)/rotate-pdf/page.tsx` |
| `/delete-pdf` | delete-pdf | `src/app/(tools)/delete-pdf/page.tsx` |
| `/extract-pdf` | extract-pdf | `src/app/(tools)/extract-pdf/page.tsx` |
| `/compress-pdf` | compress-pdf | `src/app/(tools)/compress-pdf/page.tsx` |
| `/pdf-to-word` | pdf-to-word | `src/app/(tools)/pdf-to-word/page.tsx` |
| `/word-to-pdf` | word-to-pdf | `src/app/(tools)/word-to-pdf/page.tsx` |
| `/pdf-to-excel` | pdf-to-excel | `src/app/(tools)/pdf-to-excel/page.tsx` |
| `/excel-to-pdf` | excel-to-pdf | `src/app/(tools)/excel-to-pdf/page.tsx` |
| `/pdf-to-ppt` | pdf-to-ppt | `src/app/(tools)/pdf-to-ppt/page.tsx` |
| `/ppt-to-pdf` | ppt-to-pdf | `src/app/(tools)/ppt-to-pdf/page.tsx` |
| `/jpg-to-pdf` | jpg-to-pdf | `src/app/(tools)/jpg-to-pdf/page.tsx` |
| `/html-to-pdf` | html-to-pdf | `src/app/(tools)/html-to-pdf/page.tsx` |
| `/txt-to-pdf` | txt-to-pdf | `src/app/(tools)/txt-to-pdf/page.tsx` |
| `/add-watermark` | add-watermark | `src/app/(tools)/add-watermark/page.tsx` |
| `/sign-pdf` | sign-pdf | `src/app/(tools)/sign-pdf/page.tsx` |
| `/protect-pdf` | protect-pdf | `src/app/(tools)/protect-pdf/page.tsx` |
| `/unlock-pdf` | unlock-pdf | `src/app/(tools)/unlock-pdf/page.tsx` |
| `/pdf-scanner` | pdf-scanner | `src/app/(tools)/pdf-scanner/page.tsx` |
| `/edit-pdf` | edit-pdf | `src/app/(tools)/edit-pdf/page.tsx` |
| `/ai-pdf-summarizer` | ai-pdf-summarizer | `src/app/(tools)/ai-pdf-summarizer/page.tsx` |

---

## All API routes (51)

### Tools (29)

`merge-pdf`, `split-pdf`, `rotate-pdf`, `delete-pdf`, `extract-pdf`, `compress-pdf`, `compose-pdf`, `pdf-session`, `pdf-meta`, `pdf-previews`, `pdf-thumb`, `pdf-text-blocks`, `pdf-to-word` (+ `status`, `download`), `word-to-pdf`, `pdf-to-excel`, `excel-to-pdf`, `pdf-to-ppt`, `ppt-to-pdf`, `jpg-to-pdf`, `html-to-pdf`, `txt-to-pdf`, `add-watermark`, `sign-pdf`, `protect-pdf`, `unlock-pdf`, `pdf-scanner`, `edit-pdf`

Path pattern: `src/app/api/tools/<slug>/route.ts`

### Auth (7)

`login`, `logout`, `signup`, `session`, `me`, `forgot-password/send-code`, `forgot-password/verify-code`, `reset-password`

### Admin (7)

`dashboard`, `users`, `jobs`, `settings`, `coupons`, `cleanup`

### Other (8)

`files/upload`, `files/[id]`, `payments/create-order`, `payments/verify`, `payments/webhook`, `ai/summarize`, `ai/summarize/export`, `cron/cleanup`

---

## Current stage — what changed at this S1 save

### OnlyMyPDF brand & UI

| Change | Path |
|--------|------|
| Logo D locked (stacked gradient) | `src/config/brand-logos.ts`, `src/app/icon.png` |
| Brand constants | `src/config/constants.ts`, `src/config/brand.ts` |
| Header nav sizing + All Tools dropdown centered | `src/components/layout/header.tsx` |
| Dashboard sidebar layout | `src/components/dashboard/dashboard-layout.tsx` |
| Dashboard overview redesign | `src/app/dashboard/page.tsx` |
| Dashboard pricing (compact, space-optimized) | `src/app/dashboard/pricing/page.tsx`, `src/components/dashboard/dashboard-pricing.tsx` |
| Marketing pricing page | `src/components/marketing/pricing-page-content.tsx`, `src/app/pricing/page.tsx` |
| User files API | `src/app/api/user/files/route.ts` |

### PDF Scanner (redesigned workspace)

| Component | Path |
|-----------|------|
| Compact workspace UI | `src/components/tools/pdf-scanner/pdf-scanner-workspace.tsx` |
| Tool page | `src/app/(tools)/pdf-scanner/page.tsx` |

### AI PDF Summarizer polish

| Change | Path |
|--------|------|
| Related tools section | `src/app/(tools)/ai-pdf-summarizer/page.tsx` |
| Compact workspace (`compactWorkspace`) | `src/components/layout/tool-page-shell.tsx` |
| Removed duplicate privacy line | same page |

### Excel → PDF (verified good on Windows)

| Component | Path |
|-----------|------|
| Main service | `src/lib/services/excel-to-pdf.service.ts` |
| Excel COM export (primary on Windows) | `src/lib/services/excel-com-export.service.ts` |
| VBScript exporter | `scripts/excel-export-pdf.vbs` |
| HTML/Puppeteer fallback | `src/lib/services/html-to-pdf.service.ts` |
| API route | `src/app/api/tools/excel-to-pdf/route.ts` |
| Tool page | `src/app/(tools)/excel-to-pdf/page.tsx` |

**Conversion priority:** Excel COM → LibreOffice → SheetJS + Puppeteer

**Fallback improvements:**
- Bold-row header detection (not fixed 3-row header band)
- Proper `<thead>` / `<tbody>` structure
- Left-aligned headers, right-aligned numbers/dates
- 500-row HTML chunks for large sheets
- 240s print timeout for Puppeteer
- Zebra striping on data rows

**Verified:** `file_example_XLS_5000.xls` → native Excel PDF matches data (Dulce, Mara, etc.)

### PDF → Excel (SmallPDF-quality targets)

| Component | Path |
|-----------|------|
| Main service | `src/lib/services/pdf-to-excel.service.ts` |
| Document layout fallback (TS) | `src/lib/services/pdf-document-excel.service.ts` |
| Python extraction | `scripts/pdf-extract-tables.py` |
| Cannabis reference JSON | `scripts/templates/cannabis-thailand-smallpdf-ref.json` |
| Compare script | `scripts/compare-smallpdf-excel.py` |
| API route | `src/app/api/tools/pdf-to-excel/route.ts` |
| Tool page | `src/app/(tools)/pdf-to-excel/page.tsx` |

**Modes:**
- **Financial:** 62-col cannabis grid, landscape sibling fallback, reference JSON for portrait uploads
- **Document:** The786-style founder summary — 3-col summary box, section splits, narrative bullets

**Fixes:** TS fallback only when Python output is weak; Excel styling 9pt / `#,##0`; document Times New Roman styling

### Sign PDF (Smallpdf-style workspace)

| Component | Path |
|-----------|------|
| Workspace UI | `src/components/tools/sign-pdf/sign-pdf-workspace.tsx` |
| Signature modal | `src/components/tools/sign-pdf/signature-create-modal.tsx` |
| Multi-annotation service | `src/lib/services/pdf-sign.service.ts` |
| API (annotations array) | `src/app/api/tools/sign-pdf/route.ts` |
| Page | `src/app/(tools)/sign-pdf/page.tsx` |

Annotation types: image, text, date, check

### UI polish (all convert tools)

| Change | File |
|--------|------|
| File size on success panel | `src/components/tools/convert-tool-page.tsx` → `resultSizeBytes` on `ToolSuccessPanel` |

### PDF-to-Word pipeline v3 (unchanged from prior S1 — still active)

| Component | Path |
|-----------|------|
| Python conversion | `scripts/pdf-to-docx.py`, `scripts/pdf-to-docx-range.py` |
| Layout transform | `scripts/smallpdf_transform.py` |
| Engine router | `src/lib/services/pdf-to-word.service.ts` |
| Job store | `src/lib/services/pdf-to-word-jobs.service.ts` |
| Dedicated UI | `src/components/tools/pdf-to-word-tool-page.tsx` |

Engine priority: ConvertAPI → pdf2docx → Node extractor

### Other pipelines (active)

| Tool | Engine |
|------|--------|
| Word → PDF | Word COM → LibreOffice → Mammoth + Puppeteer |
| PPT → PDF | PowerPoint COM → LibreOffice → HTML slides |
| PDF → PPT | PyMuPDF + PptxGenJS |
| HTML → PDF | Puppeteer |
| Merge/Split/Rotate/Delete/Extract | pdf-lib / muhammara |
| Protect/Unlock | @pdfsmaller/pdf-encrypt / pdf-decrypt |
| Compress | Ghostscript / pdf-lib |
| AI Summarizer | Google Generative AI |

---

## Config & registry

| Item | Path |
|------|------|
| Tool list | `src/config/constants.ts` |
| SEO per tool | `src/config/tools.ts` |
| Design lock | `src/config/design-system.ts` |
| i18n EN | `src/i18n/en.json` |
| i18n HI | `src/i18n/hi.json` |
| Header nav | `src/components/layout/header.tsx` |
| Home tool grid | `src/components/marketing/home/home-shared.ts` |

---

## Images & assets

| Asset | Path |
|-------|------|
| Hero visuals | `src/components/marketing/hero-visual-v*.tsx` |
| PDF.js worker | `public/pdf.worker.min.mjs` |
| Watermark logo | `scripts/templates/watermark-logo.png` |
| Word templates | `scripts/templates/smallpdf-ref/` |
| Cannabis ref | `scripts/templates/cannabis-thailand-smallpdf-ref.json` |

---

## Deployment notes (at S1)

| Environment | Status |
|-------------|--------|
| **Local Windows dev** | Full quality — Excel COM, Word COM, PowerPoint COM |
| **Vercel** | Recommended for Next.js app (`vercel.json` present) |
| **Hostinger shared Business** | Not suitable for full app — no Excel COM, no Puppeteer at scale |
| **Recommended prod** | Hostinger domain + Vercel app |

---

## Local backup only (`.snapshots/s1/` — never git)

| Item | Path |
|------|------|
| Env secrets | `.snapshots/s1/.env.local.backup` |
| Full template tree | `.snapshots/s1/scripts-templates/` |
| Core Python scripts | `.snapshots/s1/scripts-core/` |
| PDF-to-Word TS mirror | `.snapshots/s1/pdf-to-word-src/` |
| Excel pipeline mirror | `.snapshots/s1/excel-to-pdf-src/` |
| PDF-to-Excel mirror | `.snapshots/s1/pdf-to-excel-src/` |
| Public assets mirror | `.snapshots/s1/public/` |
| Manifest | `.snapshots/s1/MANIFEST.txt` |
| This doc copy | `.snapshots/s1/S1-SNAPSHOT.md` |

---

## NOT in git (restore after revert)

- `node_modules` → `npm install`
- `.next` → `npm run dev`
- `.env.local` → from `.snapshots/s1/.env.local.backup`
- Python: `pip install pymupdf` + `.\scripts\setup-pdf2docx.ps1`
- Excel COM: requires Windows + Microsoft Excel installed

---

## Revert to S1

**Say:** `revert to s1`

**Or run:**

```powershell
cd pdf-doctor
.\scripts\revert-to-s1.ps1
```

---

## Refresh S1 (save current state again)

```powershell
.\scripts\save-s1.ps1
```

Updates git tag `S1`, branch `s1-backup`, and local `.snapshots/s1/` copies.
