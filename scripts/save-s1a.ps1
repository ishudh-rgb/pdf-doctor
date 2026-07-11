# Save S1-a snapshot — full site backup (pages, links, code, images, E2E, security)
# Usage: .\scripts\save-s1a.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$TagName = "S1-a"
$BranchName = "s1-a-backup"
$SnapLabel = "s1-a"

Write-Host "=== OnlyMyPDF: Save $TagName Snapshot ===" -ForegroundColor Cyan

$snapDir = Join-Path $Root ".snapshots\$SnapLabel"
New-Item -ItemType Directory -Force -Path $snapDir | Out-Null

# --- .env.local (secrets — local only, never git) ---
$envPath = Join-Path $Root ".env.local"
$envBackup = Join-Path $snapDir ".env.local.backup"
if (Test-Path $envPath) {
  Copy-Item $envPath $envBackup -Force
  Write-Host "  .env.local backed up to .snapshots/$SnapLabel/" -ForegroundColor Gray
}

# --- PDF-to-Word templates + images ---
$tplSrc = Join-Path $Root "scripts\templates"
$tplDst = Join-Path $snapDir "scripts-templates"
if (Test-Path $tplSrc) {
  if (Test-Path $tplDst) { Remove-Item $tplDst -Recurse -Force }
  Copy-Item $tplSrc $tplDst -Recurse -Force
  Write-Host "  scripts/templates copied" -ForegroundColor Gray
}

# --- Public assets (images, logos, worker, icons) — 100% ---
$pubSrc = Join-Path $Root "public"
$pubDst = Join-Path $snapDir "public"
if (Test-Path $pubSrc) {
  if (Test-Path $pubDst) { Remove-Item $pubDst -Recurse -Force }
  Copy-Item $pubSrc $pubDst -Recurse -Force
  Write-Host "  public/ copied (all images + logos)" -ForegroundColor Gray
}

# --- Reference DOCX output (if present) ---
$refDocx = Join-Path $Root "test-output\merged-test.docx"
$refBackup = Join-Path $snapDir "reference-merged-test.docx"
if (Test-Path $refDocx) {
  Copy-Item $refDocx $refBackup -Force
}

# --- Core Python pipeline ---
$pyFiles = @(
  "scripts\smallpdf_transform.py",
  "scripts\pdf-to-docx.py",
  "scripts\pdf-to-docx-range.py",
  "scripts\setup-pdf2docx.ps1",
  "scripts\smallpdf_normalize.py",
  "scripts\smallpdf-rotation.py",
  "scripts\create-placeholder-assets.mjs"
)
$pyDstDir = Join-Path $snapDir "scripts-core"
New-Item -ItemType Directory -Force -Path $pyDstDir | Out-Null
foreach ($rel in $pyFiles) {
  $src = Join-Path $Root $rel
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $pyDstDir (Split-Path $rel -Leaf)) -Force
  }
}
Write-Host "  Core scripts copied" -ForegroundColor Gray

# --- PDF-to-Word TypeScript mirror ---
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

# --- Global styles ---
$stylesSrc = Join-Path $Root "src\styles"
$stylesDst = Join-Path $snapDir "src-styles"
if (Test-Path $stylesSrc) {
  if (Test-Path $stylesDst) { Remove-Item $stylesDst -Recurse -Force }
  Copy-Item $stylesSrc $stylesDst -Recurse -Force
  Write-Host "  src/styles copied" -ForegroundColor Gray
}

# --- S1-a manifest doc into snapshot folder ---
$snapDoc = Join-Path $Root "S1-A-SNAPSHOT.md"
if (Test-Path $snapDoc) {
  Copy-Item $snapDoc (Join-Path $snapDir "S1-A-SNAPSHOT.md") -Force
}

git add -A
$status = git status --porcelain
if ($status) {
  $msg = @"
S1-a: OnlyMyPDF full snapshot - security, P0-P2 audit fixes, E2E smoke, images.

Includes: OAuth allowlist, magic-byte uploads, subscription payment binding,
safe tool API errors + correlationId, Hindi i18n/breadcrumbs, placeholder images,
E2E helpers (cookie consent, hydration), 438 unit tests, smoke E2E suite.
Revert: scripts/revert-to-s1a.ps1
"@
  git commit -m $msg
} else {
  Write-Host "  No new changes to commit (already clean)." -ForegroundColor Yellow
}

$null = git tag -d $TagName 2>&1
git tag -a $TagName -m "S1-a OnlyMyPDF - security + audit fixes + E2E + images (Jul 2026)"

$null = git branch -D $BranchName 2>&1
git branch $BranchName

$hash = git rev-parse HEAD
$short = git rev-parse --short HEAD
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$manifestLines = @(
  "S1-a manifest",
  "Saved: $date",
  "Commit: $hash",
  "Tag: $TagName -> $short",
  "Branch: $BranchName",
  "",
  "Local backups not in git:",
  "  .snapshots/s1-a/.env.local.backup",
  "  .snapshots/s1-a/scripts-templates/",
  "  .snapshots/s1-a/scripts-core/",
  "  .snapshots/s1-a/pdf-to-word-src/",
  "  .snapshots/s1-a/src-styles/",
  "  .snapshots/s1-a/public/",
  "  .snapshots/s1-a/S1-A-SNAPSHOT.md",
  "",
  "Revert: .\scripts\revert-to-s1a.ps1",
  "Prior snapshot: tag S1 (scripts/revert-to-s1.ps1)"
)
$manifestLines | Out-File -FilePath (Join-Path $snapDir "MANIFEST.txt") -Encoding utf8

Write-Host ""
Write-Host "$TagName saved successfully." -ForegroundColor Green
Write-Host "  Tag:    $TagName -> $short" -ForegroundColor Gray
Write-Host "  Commit: $hash" -ForegroundColor Gray
Write-Host "  Date:   $date" -ForegroundColor Gray
Write-Host "  Branch: $BranchName" -ForegroundColor Gray
Write-Host "  Local:  .snapshots\s1-a\ public env templates styles" -ForegroundColor Gray
Write-Host '  Revert: .\scripts\revert-to-s1a.ps1' -ForegroundColor Gray
