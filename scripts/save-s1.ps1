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

# --- Public assets (images, worker, icons) ---
$pubSrc = Join-Path $Root "public"
$pubDst = Join-Path $snapDir "public"
if (Test-Path $pubSrc) {
  if (Test-Path $pubDst) { Remove-Item $pubDst -Recurse -Force }
  Copy-Item $pubSrc $pubDst -Recurse -Force
  Write-Host "  public/ copied to .snapshots/s1/public/" -ForegroundColor Gray
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
  "scripts\pdf-to-docx-range.py",
  "scripts\setup-pdf2docx.ps1",
  "scripts\smallpdf_normalize.py",
  "scripts\smallpdf-rotation.py"
)
$pyDstDir = Join-Path $snapDir "scripts-core"
New-Item -ItemType Directory -Force -Path $pyDstDir | Out-Null
foreach ($rel in $pyFiles) {
  $src = Join-Path $Root $rel
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $pyDstDir (Split-Path $rel -Leaf)) -Force
  }
}
Write-Host "  Core scripts copied to .snapshots/s1/scripts-core/" -ForegroundColor Gray

# --- PDF-to-Word TypeScript mirror (offline restore) ---
$ptwFiles = @(
  "src\lib\services\pdf-to-word.service.ts",
  "src\lib\services\pdf-to-word-pdf2docx.service.ts",
  "src\lib\services\pdf-to-word-jobs.service.ts",
  "src\lib\services\pdf-to-word-convertapi.service.ts",
  "src\lib\services\pdf-to-word-node.service.ts",
  "src\lib\services\pdf-to-word-docx-post.service.ts",
  "src\components\tools\pdf-to-word-tool-page.tsx",
  "src\app\api\tools\pdf-to-word\route.ts",
  "src\app\api\tools\pdf-to-word\status\route.ts",
  "src\app\api\tools\pdf-to-word\download\route.ts",
  "src\app\(tools)\pdf-to-word\page.tsx"
)
$ptwDst = Join-Path $snapDir "pdf-to-word-src"
if (Test-Path $ptwDst) { Remove-Item $ptwDst -Recurse -Force }
New-Item -ItemType Directory -Force -Path $ptwDst | Out-Null
foreach ($rel in $ptwFiles) {
  $src = Join-Path $Root $rel
  if (Test-Path $src) {
    $dest = Join-Path $ptwDst ($rel -replace '\\', '-')
    Copy-Item $src $dest -Force
  }
}
Write-Host "  PDF-to-Word TS/API files copied to .snapshots/s1/pdf-to-word-src/" -ForegroundColor Gray

# --- Excel-to-PDF mirror (offline restore) ---
$etpFiles = @(
  "src\lib\services\excel-to-pdf.service.ts",
  "src\lib\services\excel-com-export.service.ts",
  "src\lib\services\html-to-pdf.service.ts",
  "scripts\excel-export-pdf.vbs",
  "src\app\api\tools\excel-to-pdf\route.ts",
  "src\app\(tools)\excel-to-pdf\page.tsx"
)
$etpDst = Join-Path $snapDir "excel-to-pdf-src"
if (Test-Path $etpDst) { Remove-Item $etpDst -Recurse -Force }
New-Item -ItemType Directory -Force -Path $etpDst | Out-Null
foreach ($rel in $etpFiles) {
  $src = Join-Path $Root $rel
  if (Test-Path $src) {
    $dest = Join-Path $etpDst ($rel -replace '\\', '-')
    Copy-Item $src $dest -Force
  }
}
Write-Host "  Excel-to-PDF files copied to .snapshots/s1/excel-to-pdf-src/" -ForegroundColor Gray

# --- PDF-to-Excel mirror (offline restore) ---
$pteFiles = @(
  "src\lib\services\pdf-to-excel.service.ts",
  "src\lib\services\pdf-document-excel.service.ts",
  "scripts\pdf-extract-tables.py",
  "scripts\compare-smallpdf-excel.py",
  "scripts\templates\cannabis-thailand-smallpdf-ref.json",
  "src\app\api\tools\pdf-to-excel\route.ts",
  "src\app\(tools)\pdf-to-excel\page.tsx",
  "src\components\tools\convert-tool-page.tsx"
)
$pteDst = Join-Path $snapDir "pdf-to-excel-src"
if (Test-Path $pteDst) { Remove-Item $pteDst -Recurse -Force }
New-Item -ItemType Directory -Force -Path $pteDst | Out-Null
foreach ($rel in $pteFiles) {
  $src = Join-Path $Root $rel
  if (Test-Path $src) {
    $dest = Join-Path $pteDst ($rel -replace '\\', '-')
    Copy-Item $src $dest -Force
  }
}
Write-Host "  PDF-to-Excel files copied to .snapshots/s1/pdf-to-excel-src/" -ForegroundColor Gray

# --- Sign PDF mirror ---
$signFiles = @(
  "src\components\tools\sign-pdf\sign-pdf-workspace.tsx",
  "src\components\tools\sign-pdf\signature-create-modal.tsx",
  "src\lib\services\pdf-sign.service.ts",
  "src\app\api\tools\sign-pdf\route.ts",
  "src\app\(tools)\sign-pdf\page.tsx"
)
$signDst = Join-Path $snapDir "sign-pdf-src"
if (Test-Path $signDst) { Remove-Item $signDst -Recurse -Force }
New-Item -ItemType Directory -Force -Path $signDst | Out-Null
foreach ($rel in $signFiles) {
  $src = Join-Path $Root $rel
  if (Test-Path $src) {
    $dest = Join-Path $signDst ($rel -replace '\\', '-')
    Copy-Item $src $dest -Force
  }
}
Write-Host "  Sign PDF files copied to .snapshots/s1/sign-pdf-src/" -ForegroundColor Gray

# --- Extra Python for PDF pipelines ---
$pyExtra = @(
  "scripts\pdf-extract-tables.py",
  "scripts\compare-smallpdf-excel.py"
)
foreach ($rel in $pyExtra) {
  $src = Join-Path $Root $rel
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $pyDstDir (Split-Path $rel -Leaf)) -Force
  }
}

# --- S1 manifest doc into snapshot folder ---
$snapDoc = Join-Path $Root "S1-SNAPSHOT.md"
if (Test-Path $snapDoc) {
  Copy-Item $snapDoc (Join-Path $snapDir "S1-SNAPSHOT.md") -Force
}

git add -A
$status = git status --porcelain
if ($status) {
  $msg = "S1: OnlyMyPDF snapshot - Logo D lock, dashboard/pricing redesign, PDF Scanner UI, user files API, AI Summarizer polish. Revert: scripts/revert-to-s1.ps1"
  git commit -m $msg
}

$null = git tag -d S1 2>&1
git tag -a S1 -m "S1 OnlyMyPDF - dashboard, pricing, Logo D, PDF Scanner, user files API"

$null = git branch -D s1-backup 2>&1
git branch s1-backup

$hash = git rev-parse HEAD
$short = git rev-parse --short HEAD
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$manifestLines = @(
  "S1 manifest",
  "Saved: $date",
  "Commit: $hash",
  "Tag: S1 -> $short",
  "",
  "Local backups not in git:",
  "  .snapshots/s1/.env.local.backup",
  "  .snapshots/s1/scripts-templates/",
  "  .snapshots/s1/scripts-core/",
  "  .snapshots/s1/pdf-to-word-src/",
  "  .snapshots/s1/excel-to-pdf-src/",
  "  .snapshots/s1/pdf-to-excel-src/",
  "  .snapshots/s1/sign-pdf-src/",
  "  .snapshots/s1/public/",
  "  .snapshots/s1/S1-SNAPSHOT.md",
  "",
  "Design lock: Theme A + Layout B, OnlyMyPDF Logo D",
  "Dashboard: overview, files, pricing + layout wrapper",
  "Excel-to-PDF: Excel COM primary, SheetJS fallback",
  "PDF-to-Excel: financial + document layout modes",
  "Sign PDF: multi-annotation workspace"
)
$manifestLines | Out-File -FilePath (Join-Path $snapDir "MANIFEST.txt") -Encoding utf8

Write-Host ""
Write-Host "S1 saved successfully." -ForegroundColor Green
Write-Host "  Tag:    S1 -> $short" -ForegroundColor Gray
Write-Host "  Commit: $hash" -ForegroundColor Gray
Write-Host "  Date:   $date" -ForegroundColor Gray
Write-Host "  Branch: s1-backup" -ForegroundColor Gray
Write-Host "  Local:  .snapshots/s1/ templates, images, env, pdf-to-word-src" -ForegroundColor Gray
Write-Host '  Revert: .\scripts\revert-to-s1.ps1' -ForegroundColor Gray
