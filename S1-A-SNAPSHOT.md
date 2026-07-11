# S1-a Snapshot — OnlyMyPDF (PDF Doctor)

| Field | Value |
|-------|-------|
| **Tag** | `S1-a` |
| **Branch backup** | `s1-a-backup` |
| **Saved** | 2026-07-12 — Security restore, P0–P2 audit fixes, E2E smoke, placeholder images |
| **Prior snapshot** | `S1` (2026-06-05) — `scripts/revert-to-s1.ps1` |

---

## What S1-a adds over S1

### Security (high priority)

| Change | Path |
|--------|------|
| OAuth safe redirect allowlist | `src/lib/auth/safe-redirect.ts` |
| Magic-byte upload validation | `src/lib/server/upload-validation.ts` |
| Razorpay subscription payment binding | `src/lib/services/payment.service.ts` |
| CSRF mutation origin guards | `src/lib/server/mutation-origin.ts` |
| Safe API errors + correlationId | `src/lib/server/tool-api-error.ts`, `api-error.ts` |
| Client tool error i18n | `src/lib/client/resolve-tool-error.ts`, `use-tool-errors.ts` |

### P0 — Broken assets & links

| Change | Path |
|--------|------|
| Placeholder hero + logo images | `public/images/*.webp`, `public/logos/clean/*.png` |
| Asset generator script | `scripts/create-placeholder-assets.mjs` |
| OAuth paths `/account` → `/dashboard` | `safe-redirect.ts` |

### P1 — API & client errors

| Change | Path |
|--------|------|
| `toolJsonError()` on 23+ tool routes | `src/app/api/tools/*`, `src/lib/server/tool-request-guards.ts` |
| Workspace error wiring | `convert-tool-page.tsx`, `pdf-to-word-tool-page.tsx`, workspaces |

### P2 — Hindi & SEO

| Change | Path |
|--------|------|
| Hindi breadcrumbs | `src/components/layout/tool-layout-chrome.tsx` |
| Locale-aware nav links | `src/hooks/use-locale-href.ts`, header/footer |
| Hindi `notFound`, `thirdPartyNotice` | `src/i18n/hi.json` |
| `/status` in sitemap | `src/lib/seo/routes.ts` |
| Translated 404 | `src/app/not-found.tsx` |

### E2E smoke (20 tests)

| Spec | Coverage |
|------|----------|
| `e2e/smoke.spec.ts` | health, home, robots, sitemap |
| `e2e/tools.spec.ts` | tool UI, AEO order |
| `e2e/conversion.spec.ts` | merge upload + API, split workspace |
| `e2e/legal.spec.ts` | branding, FAQ Razorpay + 25MB |
| `e2e/checkout.spec.ts` | auth-gated payments |

Helpers: `e2e/helpers.ts` — cookie consent, hydration wait, `apiOriginHeaders()`.

### New / expanded pages (since S1)

| Route | File |
|-------|------|
| `/status` | `src/app/status/page.tsx` |
| `/refund` | `src/app/refund/page.tsx` |
| `/trust` | `src/app/trust/page.tsx` |
| `/sla` | `src/app/sla/page.tsx` |
| `/account-suspended` | `src/app/account-suspended/page.tsx` |
| `/dashboard/enterprise` | `src/app/dashboard/enterprise/page.tsx` |
| `/dashboard/security` | `src/app/dashboard/security/page.tsx` |
| `/admin/organizations` | `src/app/admin/organizations/page.tsx` |

### Verification at save time

| Gate | Result |
|------|--------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (0 errors) |
| `npm run test` | 438/438 |
| `npm run test:coverage` | ~33% lines (threshold 32%) |
| `npm run audit:ci` | Pass (1 moderate tar via muhammara) |
| `npm run test:e2e:smoke` | 20/20 (after E2E fixes) |

**Conversion pipeline:** NOT modified in this snapshot phase.

---

## Locked design (unchanged from S1)

| Setting | Value |
|---------|-------|
| Brand theme | A — Enterprise Navy |
| UX layout | B — Split panel |
| Brand name | OnlyMyPDF |
| Logo | D — Stacked gradient |
| Pro file limit | 200 MB |
| Free file limit | 25 MB |

---

## Save S1-a

```powershell
cd pdf-doctor
.\scripts\save-s1a.ps1
```

## Revert to S1-a

```powershell
.\scripts\revert-to-s1a.ps1
```

## Revert to older S1

```powershell
.\scripts\revert-to-s1.ps1
```

---

## Local backup folder

`.snapshots/s1-a/` contains (not in git):

- `public/` — all images, logos, icons
- `.env.local.backup` — local secrets
- `scripts-templates/` — PDF-to-Word watermark assets
- `scripts-core/` — Python pipeline + placeholder script
- `pdf-to-word-src/` — conversion TS mirror
- `src-styles/` — design tokens
- `MANIFEST.txt` — commit hash + date
