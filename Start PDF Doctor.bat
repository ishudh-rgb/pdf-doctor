@echo off
chcp 65001 >nul
cd /d "%~dp0"
title PDF Doctor - Dev Server
color 0B

echo.
echo  ==========================================
echo    PDF Doctor - Local Server (1-Click)
echo  ==========================================
echo.

if not exist "node_modules\" (
    echo  [Step 1/2] Installing dependencies ^(first time only^)...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo  ERROR: npm install failed. Check Node.js is installed.
        echo  Download: https://nodejs.org/
        pause
        exit /b 1
    )
    echo.
) else (
    echo  [Step 1/2] Dependencies OK
)

echo  [Step 2/2] Starting server...
echo.
echo    URL:  http://localhost:3000
echo    Stop: Press Ctrl+C in this window
echo.

REM Open browser ~6 seconds after start
start "" cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:3000"

call npm run dev

echo.
echo  Server stopped.
pause
