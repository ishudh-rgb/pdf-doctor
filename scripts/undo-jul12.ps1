# Undo Jul 12 session changes — restore Jul 3 end-of-day state
# Keeps Jul 2-3 work; removes Jul 12 security/deploy/e2e session deltas.
# Full backup: branch backup/jul12-pre-undo (commit b143a53)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "=== Undo Jul 12 changes (restore pre-Jul-12 state) ===" -ForegroundColor Cyan

# Files created or fully rewritten during Jul 12 (Jul 3 did not have these)
$jul12NewFiles = @(
  "src/lib/auth/recovery-session.ts",
  "src/lib/auth/safe-redirect.ts",
  "src/lib/auth/safe-redirect.test.ts",
  "src/app/api/auth/recovery-session/route.ts",
  "src/lib/server/upload-validation.ts",
  "src/lib/utils/sanitize-html.ts",
  "src/lib/utils/sanitize-svg.ts",
  "src/lib/utils/sanitize.test.ts",
  "src/lib/services/payment-subscription-verify.test.ts",
  "src/lib/auth/local-dev-session-secret.ts",
  "src/lib/email/resend-errors.ts",
  "src/lib/privacy/public-profile.ts",
  "src/lib/rate-limit-message.ts",
  "src/lib/rate-limit-message.test.ts",
  "src/lib/server/api-error.ts",
  "src/lib/server/api-error.test.ts",
  "src/lib/server/correlation-id.ts",
  "src/lib/server/safe-log.ts",
  "src/lib/server/safe-log.test.ts",
  "src/components/privacy/third-party-data-notice.tsx",
  "src/lib/supabase/unconfigured.ts",
  "lint-errors.txt",
  "lint-out.txt"
)

foreach ($rel in $jul12NewFiles) {
  $full = Join-Path $Root $rel
  if (Test-Path $full) {
    Remove-Item $full -Force -Recurse
    Write-Host "  removed $rel" -ForegroundColor Yellow
  }
}

# Jul 12 touched files that existed Jul 3 — restore from backup parent via git show on
# files unchanged between Jul3 and Jul12 except Jul12 delta is hard; use git checkout
# from ad37110 only when file was NOT part of Jul2-3 diff from ad37110.

# For Jul-12-modified files that also changed Jul 2-3: restore pre-Jul12 from git stash of
# transcript-derived reverse. Practical approach: checkout from ad37110 when Jul2-3 didn't
# change the file (diff ad37110..backup empty for jul12-only touch is rare).

# Restore Jul-3 versions of Jul-12-touched files from git object before Jul12 edits:
# We stored full backup at backup/jul12-pre-undo; Jul3 = backup minus jul12NewFiles minus
# manual reversions on touched tracked files below.

$jul12TouchedRestoreFromHead = @(
  # Files where Jul 12 changes should be dropped; Jul 2-3 changes live in ad37110..backup
  # but these were only lightly touched Jul 12 on top of Jul 3 — restore via git from
  # backup/jul12-pre-undo~0 using pre-jul12 snapshot file list from transcript StrReplace only.
)

# Restore files that exist in ad37110 and were ONLY modified Jul 12 (not Jul 2-3)
# Identified: Jul 2-3 changed 387 files vs ad37110; Jul 12 touched 87. Intersection restored manually.

# Checkout Jul-3-era versions from git: use `git show ad37110:path` for files unchanged Jul2-3
$onlyJul12OnAd37110 = @(
  "src/lib/services/excel-com-export.service.ts",
  "src/lib/services/libreoffice-core.service.ts",
  "src/lib/services/pdf-to-word-word-com.service.ts",
  "src/lib/services/word-com-export.service.ts",
  "src/app/api/admin/users/route.ts",
  "src/app/api/user/files/route.ts",
  "src/lib/admin/audit-log.ts",
  "src/lib/db/queries.ts",
  "src/lib/email/contact-mailer.ts",
  "src/lib/email/org-invite-mailer.ts",
  "src/lib/auth/password-reset-mailer.ts",
  "src/lib/privacy/consent-client.ts",
  "src/lib/ops/sentry-config.ts",
  "src/lib/ops/sentry.ts",
  "src/components/tools/pdf-to-word-tool-page.tsx",
  "src/app/(tools)/ai-pdf-summarizer/page.tsx"
)

foreach ($rel in $onlyJul12OnAd37110) {
  git checkout ad37110 -- $rel 2>$null
  if ($LASTEXITCODE -eq 0) { Write-Host "  restored from ad37110: $rel" -ForegroundColor Gray }
}

Write-Host "Manual Jul-12 revert pass required for remaining touched files." -ForegroundColor Green
Write-Host "Backup branch: backup/jul12-pre-undo" -ForegroundColor Gray
