# S1 Snapshot — PDF Doctor

| Field | Value |
|-------|-------|
| **Tag** | `S1` |
| **Branch backup** | `s1-backup` |
| **Commit** | `249e3e7` (run `git rev-parse S1` to verify) |
| **Saved** | 2026-05-27 |

## What's included (100% website)

- All pages: homepage, tools, auth, dashboard, admin, pricing, legal
- All PDF tools + API routes + services
- Live preview components (watermark, sign, compress, split, jpg-to-pdf, scanner, edit)
- Theme, Tailwind styles, i18n (EN/HI)
- Public assets: `public/images/hero-product-*.webp`, SVGs
- Config: constants, tools registry, middleware, Supabase schema
- Cursor rule: `.cursor/rules/s1-snapshot.mdc`

## NOT in git (restore separately)

- `.env.local` → backed up locally to `.snapshots/s1/.env.local.backup`
- `node_modules` → run `npm install` after revert
- `.next` → regenerated on `npm run dev`

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
