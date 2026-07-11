# Revert OnlyMyPDF to S1-a snapshot (100% website restore)
# Usage: .\scripts\revert-to-s1a.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$TagName = "S1-a"

Write-Host "=== OnlyMyPDF: Revert to $TagName ===" -ForegroundColor Cyan

if (-not (git rev-parse --verify $TagName 2>$null)) {
  Write-Host "ERROR: Git tag '$TagName' not found. Run save-s1a.ps1 first." -ForegroundColor Red
  exit 1
}

$dirty = git status --porcelain
if ($dirty) {
  Write-Host "Stashing uncommitted changes..." -ForegroundColor Yellow
  git stash push -u -m "pre-revert-to-s1a-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
}

Write-Host "Resetting to tag $TagName..." -ForegroundColor Green
git checkout master 2>$null
if ($LASTEXITCODE -ne 0) { git checkout main 2>$null }
git reset --hard $TagName

Write-Host "Restoring local env from snapshot (if exists)..." -ForegroundColor Green
$envBackup = Join-Path $Root ".snapshots\s1-a\.env.local.backup"
if (Test-Path $envBackup) {
  Copy-Item $envBackup (Join-Path $Root ".env.local") -Force
  Write-Host "  .env.local restored from .snapshots/s1-a/" -ForegroundColor Gray
} else {
  Write-Host "  No .env.local backup — copy from .env.example if needed." -ForegroundColor Yellow
}

Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

Write-Host ""
Write-Host "$TagName restore complete." -ForegroundColor Green
Write-Host "  Tag:    $TagName" -ForegroundColor Gray
Write-Host "  Commit: $(git rev-parse --short $TagName)" -ForegroundColor Gray
Write-Host "  Run:    npm run dev" -ForegroundColor Gray
