# Revert PDF Doctor to S1 snapshot (100% website restore)
# Usage: .\scripts\revert-to-s1.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "=== PDF Doctor: Revert to S1 ===" -ForegroundColor Cyan

if (-not (git rev-parse --verify S1 2>$null)) {
  Write-Host "ERROR: Git tag 'S1' not found. Run save-s1.ps1 first or check git tags." -ForegroundColor Red
  exit 1
}

$current = git branch --show-current
$dirty = git status --porcelain

if ($dirty) {
  Write-Host "Stashing uncommitted changes..." -ForegroundColor Yellow
  git stash push -u -m "pre-revert-to-s1-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
}

Write-Host "Resetting to tag S1..." -ForegroundColor Green
git checkout master 2>$null
if ($LASTEXITCODE -ne 0) { git checkout main 2>$null }
git reset --hard S1

Write-Host "Restoring local env from snapshot (if exists)..." -ForegroundColor Green
$envBackup = Join-Path $Root ".snapshots\s1\.env.local.backup"
if (Test-Path $envBackup) {
  Copy-Item $envBackup (Join-Path $Root ".env.local") -Force
  Write-Host "  .env.local restored from .snapshots/s1/" -ForegroundColor Gray
} else {
  Write-Host "  No .env.local backup found — copy from .env.example if needed." -ForegroundColor Yellow
}

Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

Write-Host ""
Write-Host "S1 restore complete." -ForegroundColor Green
Write-Host "  Tag:    S1" -ForegroundColor Gray
Write-Host "  Commit: $(git rev-parse --short S1)" -ForegroundColor Gray
Write-Host "  Run:    npm run dev" -ForegroundColor Gray
