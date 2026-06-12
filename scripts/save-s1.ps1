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

# --- S1 manifest doc into snapshot folder ---
$snapDoc = Join-Path $Root "S1-SNAPSHOT.md"
if (Test-Path $snapDoc) {
  Copy-Item $snapDoc (Join-Path $snapDir "S1-SNAPSHOT.md") -Force
}

git add -A
$status = git status --porcelain
if ($status) {
  $msg = "S1: Only4PDF snapshot - PDF-to-Word v3 chunked conversion, password unlock, disk jobs, encrypted PDF repair. Revert: scripts/revert-to-s1.ps1"
  git commit -m $msg
}

$null = git tag -d S1 2>&1
git tag -a S1 -m "S1 Only4PDF snapshot - PDF-to-Word v3 + all tools"

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
  "  .snapshots/s1/public/",
  "  .snapshots/s1/S1-SNAPSHOT.md",
  "",
  "Design lock: Theme A + Layout B",
  "PDF-to-Word v2: job polling + live progress + drawing-heavy fast path"
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
