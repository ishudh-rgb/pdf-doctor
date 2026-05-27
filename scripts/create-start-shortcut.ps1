# Creates a Desktop shortcut to start PDF Doctor with one click
$projectRoot = Split-Path -Parent $PSScriptRoot
$batPath = Join-Path $projectRoot "Start PDF Doctor.bat"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "PDF Doctor - Start Server.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = "Start PDF Doctor dev server (localhost:3000)"
$shortcut.WindowStyle = 1
$shortcut.Save()

Write-Host "Desktop shortcut created:"
Write-Host "  $shortcutPath"
Write-Host ""
Write-Host "Double-click it anytime to start the server."
