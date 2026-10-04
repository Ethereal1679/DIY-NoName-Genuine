@echo off
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"

where node >nul 2>nul || (
	winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements || goto fail
)
where pnpm >nul 2>nul || call npm install -g pnpm || goto fail

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-and-start.ps1" -Mode Electron
exit /b %errorlevel%

:fail
echo.
echo Environment installation failed.
pause
exit /b 1
