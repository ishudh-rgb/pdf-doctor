# Save / refresh S1 snapshot (run after major milestones)
# Usage: .\scripts\save-s1.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "=== PDF Doctor: Save S1 Snapshot ===" -ForegroundColor Cyan

$snapDir = Join-Path $Root ".snapshots\s1"
New-Item -ItemType Directory -Force -Path $snapDir | Out-Null
$envPath = Join-Path $Root ".env.local"
$envBackup = Join-Path $snapDir ".env.local.backup"
if (Test-Path $envPath) {
  Copy-Item $envPath $envBackup -Force
  Write-Host "  .env.local backed up to .snapshots/s1/" -ForegroundColor Gray
}

git add -A
$status = git status --porcelain
if ($status) {
  $msg = "S1: Complete website snapshot - Theme A + Layout B locked, tools, previews, i18n. Revert with scripts/revert-to-s1.ps1"
  git commit -m $msg
}

$null = git tag -d S1 2>&1
git tag -a S1 -m "S1 PDF Doctor complete website snapshot"

$null = git branch -D s1-backup 2>&1
git branch s1-backup

$hash = git rev-parse HEAD
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host ""
Write-Host "S1 saved successfully." -ForegroundColor Green
Write-Host "  Tag:    S1 -> $(git rev-parse --short S1)" -ForegroundColor Gray
Write-Host "  Commit: $hash" -ForegroundColor Gray
Write-Host "  Date:   $date" -ForegroundColor Gray
Write-Host "  Branch: s1-backup" -ForegroundColor Gray
Write-Host "  Revert: .\scripts\revert-to-s1.ps1" -ForegroundColor Gray
