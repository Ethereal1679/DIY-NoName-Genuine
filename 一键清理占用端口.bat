@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

net session >nul 2>&1
if errorlevel 1 (
    echo Requesting administrator permission...
    powershell.exe -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\cleanup-dev-servers.ps1"
set "CLEANUP_RESULT=%errorlevel%"
if not "%CLEANUP_RESULT%"=="0" (
    echo.
    echo Cleanup did not finish completely. Review the messages above.
)
echo.
pause
exit /b %CLEANUP_RESULT%
