# PDF Doctor — Enterprise UX/UI Redesign (v2)

**Date:** 2026-05-27  
**Status:** Production design locked  
**Locked combo:** Theme **A** (Enterprise Navy) + Layout **B** (Split panel)

---

## 0. Expert decisions (locked)

| Decision | Choice | Reason |
|----------|--------|--------|
| Brand name | Keep **PDF Doctor** | Existing SEO + user trust |
| Dark mode | **No** for v1 launch | Enterprise PDF tools ship one polished light theme first |
| Locked combo | **Theme A + Layout B** | User-approved: Enterprise Navy + Stripe split-panel |
| Preview panel | **Disabled** (`DESIGN_LOCKED=true`) | Re-enable via `DESIGN_LOCKED=false` + env flag |
| Accessibility | Skip link, focus rings, reduced-motion, WCAG AA contrast | Enterprise requirement |
| Toasts | Add in Phase 2 (`sonner` or lightweight custom) | Unified success/error feedback |
| Trust strip | Add in Phase 2 on homepage + tool pages | "Files deleted in 2h · Secure · No signup for basics" |
| Per-tool random colors | **Remove** in Phase 3 | Single brand accent + icons only |
| Hindi i18n | **Keep** | Noto Sans Devanagari + balanced line-height |

---

## 1. Goals

| Goal | Detail |
|------|--------|
| **100% new look** | Nothing should resemble current purple/indigo SaaS theme |
| **Enterprise-ready** | Trust, clarity, consistent typography, professional spacing |
| **Simplest UX** | Every tool: Upload → Options → Result (max 3 steps) |
| **Standard buttons** | One button scale across entire site (sm / md / lg) |
| **Perfect text** | Balanced line-length (60–75 chars), wrap, alignment, Hindi support |
| **Preview before lock** | Try themes & layouts live, then pick one for launch |

---

## 2. Design Preview Lab (Preview Only — Option 1)

A **fixed right-side panel** (collapsible) visible only when `NEXT_PUBLIC_DESIGN_PREVIEW=true` or in development.

### 2.1 Brand Theme (A–D) — colors + component personality

| ID | Name | Colors | Component feel |
|----|------|--------|----------------|
| **A** | Enterprise Navy | Deep navy `#0B1F3A`, white, blue accent `#2563EB` | Formal, wide grids, subtle borders |
| **B** | Modern Neutral | Slate `#0F172A`, off-white `#F8FAFC`, violet accent `#7C3AED` | Sharp corners, tight spacing, Linear-like |
| **C** | Clean Teal | Teal `#0D9488`, gray `#F1F5F9`, emerald accent | Soft cards, rounded-xl, friendly |
| **D** | Bold Minimal | Black `#09090B`, white, single red/orange accent | High contrast, bold headings, Apple-like |

Each theme changes: CSS variables, border-radius scale, shadow depth, header style, card style.

### 2.2 UX Layout Style (A–E) — page structure & flow

| ID | Reference | Homepage | Tool pages | Nav |
|----|-----------|----------|------------|-----|
| **A** | Smallpdf / iLovePDF | Tool grid hero, upload-first | Full-width dropzone, minimal chrome | Compact top bar |
| **B** | Stripe / Linear | Value prop + product screenshot | Split panel: controls left, preview right | Slim nav, mega-menu |
| **C** | Adobe / Canva | Visual hero, bold imagery | Step wizard with progress bar | Rich header, categories |
| **D** | Notion / Dropbox | Calm hero, soft cards | Centered card, generous whitespace | Simple nav + search |
| **E** | Expert mix | Smallpdf simplicity + Stripe polish | Upload-first + live preview panel | Best of A + B |

Layout styles change: homepage structure, tool page template, section spacing, hero type — **not just colors**.

### 2.3 How preview works

- User picks **Theme (A–D)** + **Layout (A–E)** independently
- Selection stored in `localStorage` (`pdf-doctor-preview-theme`, `pdf-doctor-preview-layout`)
- `data-theme="A"` and `data-layout="E"` on `<html>` drive CSS + component variants
- Panel shows current combo label, e.g. `"Theme C + Layout B"`
- **"Lock this design"** button copies choice to a config file for final build (manual step)

### 2.4 After you decide

1. You tell us: e.g. `"Lock Theme B + Layout E"`
2. We remove preview panel (`DESIGN_PREVIEW=false`)
3. Hard-code winning tokens in `globals.css` + design system
4. Delete unused theme/layout variant code (or keep in git history only)

---

## 3. Design System (shared across all previews)

### 3.1 Typography

| Role | Font | Size | Line-height |
|------|------|------|-------------|
| Display | **Plus Jakarta Sans** | 48–56px | 1.1 |
| H1 | Plus Jakarta Sans | 36px | 1.2 |
| H2 | Plus Jakarta Sans | 28px | 1.25 |
| Body | **Inter** | 16px | 1.6 |
| Small / labels | Inter | 14px | 1.5 |
| Hindi | **Noto Sans Devanagari** | same scale | 1.45 |

Max prose width: `max-w-prose` (65ch) for readable wrap.

### 3.2 Button scale (site-wide standard)

| Size | Height | Padding | Font | Use |
|------|--------|---------|------|-----|
| **sm** | 36px | 12px 16px | 14px medium | Secondary, inline |
| **md** | 44px | 12px 24px | 15px semibold | **Default CTA** |
| **lg** | 52px | 16px 32px | 16px semibold | Hero, primary tool action |

One `<Button>` component — no inline random sizes on tool pages.

### 3.3 Spacing & grid

- Base unit: 4px
- Section padding: `py-16 lg:py-24`
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Tool workspace: `max-w-6xl`, 2-column on lg when preview exists

### 3.4 Color tokens (CSS variables)

```css
--color-brand, --color-brand-muted, --color-surface, --color-surface-elevated,
--color-border, --color-text, --color-text-muted, --color-success, --color-danger
```

Themes override these variables only — components never hardcode hex.

---

## 4. Pages to redesign (100%)

### Marketing
- `/` Homepage
- `/all-tools`, `/convert`, `/pricing`, `/about`, `/contact`, `/faq`
- `/terms`, `/privacy`

### Auth
- `/login`, `/signup`, `/forgot-password`, `/reset-password`

### Tools (unified template)
- merge, split, compress, edit, sign, protect, unlock
- pdf-to-word, word-to-pdf, pdf-to-excel, excel-to-pdf, pdf-to-ppt, ppt-to-pdf
- jpg-to-pdf, add-watermark, pdf-scanner, ai-pdf-summarizer

### App
- `/dashboard`, `/dashboard/files`

### Admin
- All admin pages + sidebar

### Shared components
- Header, Footer, Auth shell, Tool page layout, Upload zone, Processing/Result views, Preview shell, Modals, Forms

---

## 5. Expert additions (included)

- **Trust strip:** "Files deleted in 2h · SSL · No watermarks on Pro"
- **Empty states** for every tool (no file uploaded yet)
- **Skeleton loaders** during processing
- **Error states** with plain-language messages + retry
- **Mobile-first** tool flows (stacked layout, 44px touch targets)
- **Focus rings** for keyboard accessibility
- **Breadcrumbs** on tool pages (Home → Tools → Merge PDF)
- **Consistent step indicator** (1. Upload · 2. Options · 3. Download)
- **New hero assets** per layout style (SVG/illustration, not old webp)
- **Remove per-tool random colors** — tools use theme accent + icon only

---

## 6. What does NOT change

- All API routes & backend services
- Tool functionality & file processing logic
- i18n keys (EN/HI) — restyle only
- S1 git tag (revert safety net)
- Auth & payment flows (visual only)

---

## 7. Implementation phases

| Phase | Work | Est. |
|-------|------|------|
| **1** | Design tokens, fonts, Button/Input/Card, Preview Lab panel | 1 session |
| **2** | Header, Footer, Homepage (all 5 layouts) | 1 session |
| **3** | Unified `ToolPageTemplate` + migrate all 15+ tools | 2 sessions |
| **4** | Auth, Dashboard, Pricing, legal pages | 1 session |
| **5** | Admin panel reskin | 1 session |
| **6** | New imagery, polish, build verify, remove preview flag | 1 session |

**Total:** ~6–7 focused sessions. You preview A–D × A–E combos after Phase 2–3, lock before Phase 6.

---

## 8. Recommended default (if you can't decide)

**Theme B (Modern Neutral) + Layout E (Expert mix)** — best balance of tool simplicity and enterprise trust for PDF Doctor.

---

## 9. Approval checklist

- [ ] Preview Lab approach (Theme A–D + Layout A–E, preview only)
- [ ] Typography & button scale
- [ ] All pages in scope
- [ ] Expert additions list
- [ ] Implementation phases

**Reply:** `Approved — start Phase 1` or list changes.
