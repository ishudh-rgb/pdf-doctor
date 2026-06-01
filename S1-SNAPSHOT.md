# S1 Snapshot — PDF Doctor

| Field | Value |
|-------|-------|
| **Tag** | `S1` |
| **Branch backup** | `s1-backup` |
| **Commit** | `ca6d826` (snapshot body `7e3dee6` + manifest doc) |
| **Saved** | 2026-06-01 21:33 — website + PDF-to-Word + CONFIDENTIAL watermarks |

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
- **PDF tools:** merge, split, compress, pdf-to-word, word-to-pdf, jpg-to-pdf, watermark, sign, protect, unlock, scanner, edit, AI summarizer
- **API routes:** tools/*, auth/*, files, payments, admin, cron
- **Live previews:** watermark, sign, compress, split, jpg-to-pdf, scanner, edit
- **i18n:** English + Hindi (`src/i18n/en.json`, `src/i18n/hi.json`)
- **Tool registry:** `src/config/tools.ts`, `src/config/constants.ts`

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
