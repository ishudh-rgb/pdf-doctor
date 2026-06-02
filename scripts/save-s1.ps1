# Save / refresh S1 snapshot (run after major milestones)
# Usage: .\scripts\save-s1.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "=== PDF Doctor: Save S1 Snapshot ===" -ForegroundColor Cyan

$snapDir = Join-Path $Root ".snapshots\s1"
New-Item -ItemType Directory -Force -Path $snapDir | Out-Null

# --- .env.local (secrets — local only, never git) ---
$envPath = Join-Path $Root ".env.local"
$envBackup = Join-Path $snapDir ".env.local.backup"
if (Test-Path $envPath) {
  Copy-Item $envPath $envBackup -Force
  Write-Host "  .env.local backed up to .snapshots/s1/" -ForegroundColor Gray
}

# --- PDF-to-Word templates + images (100% watermark assets) ---
$tplSrc = Join-Path $Root "scripts\templates"
$tplDst = Join-Path $snapDir "scripts-templates"
if (Test-Path $tplSrc) {
  if (Test-Path $tplDst) { Remove-Item $tplDst -Recurse -Force }
  Copy-Item $tplSrc $tplDst -Recurse -Force
  Write-Host "  scripts/templates copied to .snapshots/s1/scripts-templates/" -ForegroundColor Gray
}

# --- Reference DOCX output (if present) ---
$refDocx = Join-Path $Root "test-output\merged-test.docx"
$refBackup = Join-Path $snapDir "reference-merged-test.docx"
if (Test-Path $refDocx) {
  Copy-Item $refDocx $refBackup -Force
  Write-Host "  test-output/merged-test.docx backed up as reference DOCX" -ForegroundColor Gray
}

# --- Core Python pipeline (explicit copy for offline restore) ---
$pyFiles = @(
  "scripts\smallpdf_transform.py",
  "scripts\pdf-to-docx.py",
  "scripts\setup-pdf2docx.ps1"
)
$pyDstDir = Join-Path $snapDir "scripts-core"
New-Item -ItemType Directory -Force -Path $pyDstDir | Out-Null
foreach ($rel in $pyFiles) {
  $src = Join-Path $Root $rel
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $pyDstDir (Split-Path $rel -Leaf)) -Force
  }
}
Write-Host "  Core PDF-to-Word scripts copied to .snapshots/s1/scripts-core/" -ForegroundColor Gray

git add -A
$status = git status --porcelain
if ($status) {
  $msg = @"
S1: Full snapshot — website, PDF-to-Word, PPT-to-PDF (PowerPoint native), Excel-to-PDF, Theme A + Layout B.

Includes: all pages/tools/APIs, hero images, i18n, convert UI with progress meter,
PPT-to-PDF via PowerPoint COM slide export + pdf-lib embedding (Smallpdf-level accuracy),
Excel-to-PDF landscape + zoom fix, legacy .ppt support, EMF chart rendering,
smallpdf_transform.py + watermark XML templates + logo PNG asset.
Revert with scripts/revert-to-s1.ps1
"@
  git commit -m $msg
}

$null = git tag -d S1 2>&1
git tag -a S1 -m "S1 PDF Doctor complete website + PDF-to-Word snapshot"

$null = git branch -D s1-backup 2>&1
git branch s1-backup

$hash = git rev-parse HEAD
$short = git rev-parse --short HEAD
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Write manifest for strict restore reference
$manifest = @"
S1 manifest
Saved: $date
Commit: $hash
Tag: S1 -> $short

Local backups (not in git):
  .snapshots/s1/.env.local.backup
  .snapshots/s1/scripts-templates/   (watermark XML, logo PNG, smallpdf-ref styles)
  .snapshots/s1/scripts-core/        (smallpdf_transform.py, pdf-to-docx.py)
  .snapshots/s1/reference-merged-test.docx (if generated)

Design lock: Theme A (Enterprise Navy) + Layout B (Split panel)
PDF-to-Word: pdf2docx + smallpdf_transform (CONFIDENTIAL text watermarks, tables, lists)
"@
$manifest | Out-File -FilePath (Join-Path $snapDir "MANIFEST.txt") -Encoding utf8

Write-Host ""
Write-Host "S1 saved successfully." -ForegroundColor Green
Write-Host "  Tag:    S1 -> $short" -ForegroundColor Gray
Write-Host "  Commit: $hash" -ForegroundColor Gray
Write-Host "  Date:   $date" -ForegroundColor Gray
Write-Host "  Branch: s1-backup" -ForegroundColor Gray
Write-Host "  Local:  .snapshots/s1/ (templates, images, env)" -ForegroundColor Gray
Write-Host "  Revert: .\scripts\revert-to-s1.ps1" -ForegroundColor Gray
