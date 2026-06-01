# Install Python + pdf2docx for Smallpdf-quality PDF to Word conversion
Write-Host "Installing Python 3.12 (if missing)..." -ForegroundColor Cyan
winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements -h

$py312 = Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\python.exe"
if (-not (Test-Path $py312)) {
  Write-Host "Python not found at $py312 — restart terminal after install, then re-run." -ForegroundColor Red
  exit 1
}

Write-Host "Using: $py312" -ForegroundColor Green
Write-Host "Installing pdf2docx..." -ForegroundColor Cyan
& $py312 -m pip install --upgrade pip pdf2docx

Write-Host "Verifying..." -ForegroundColor Cyan
& $py312 -c "from pdf2docx import Converter; print('pdf2docx OK')"

Write-Host ""
Write-Host "Add to .env.local:" -ForegroundColor Yellow
Write-Host "PDF2DOCX_PYTHON=$py312"
Write-Host ""
Write-Host "Restart dev server, then PDF to Word will use Smallpdf-quality engine." -ForegroundColor Green
