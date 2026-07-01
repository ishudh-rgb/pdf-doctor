# Install LibreOffice for high-accuracy conversions (Smallpdf-class backup engine)
# Powers: PDF->Word, Word->PDF, Excel->PDF, PPT->PDF

Write-Host "Installing LibreOffice..." -ForegroundColor Cyan
winget install TheDocumentFoundation.LibreOffice --accept-package-agreements --accept-source-agreements -h

$soffice = "C:\Program Files\LibreOffice\program\soffice.exe"
if (-not (Test-Path $soffice)) {
  $soffice = "C:\Program Files (x86)\LibreOffice\program\soffice.exe"
}

if (-not (Test-Path $soffice)) {
  Write-Host "LibreOffice not found after install - restart terminal and re-run." -ForegroundColor Red
  exit 1
}

Write-Host "Verified: $soffice" -ForegroundColor Green
Write-Host ""
Write-Host "Tools using LibreOffice automatically:" -ForegroundColor Yellow
Write-Host "  - PDF to Word   (backup before pdf2docx)"
Write-Host "  - Word to PDF   (backup after Word COM)"
Write-Host "  - Excel to PDF  (backup after Excel COM)"
Write-Host "  - PPT to PDF    (backup after PowerPoint COM)"
Write-Host ""
Write-Host "Optional .env.local (only if install path is non-standard):" -ForegroundColor Yellow
Write-Host "LIBREOFFICE_PATH=$soffice"
Write-Host ""
Write-Host "Restart dev server after install." -ForegroundColor Green
