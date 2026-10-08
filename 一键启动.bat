@echo off
setlocal
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"

where node >nul 2>nul || (
	winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements || goto fail
)
where pnpm >nul 2>nul || call npm install -g pnpm || goto fail

rem Install dependencies and prepare the Electron binary/cache.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-and-start.ps1" -Mode Electron -InstallOnly
if errorlevel 1 goto fail

rem @noname/fs must be built before Vite resolves it from the Electron main process.
call pnpm --filter @noname/fs build
if errorlevel 1 goto fail

rem Rebuild the Electron main/preload/renderer output before starting development mode.
call pnpm --filter @noname/electron build
if errorlevel 1 goto fail

rem Start the Electron development environment (including the core renderer server).
call pnpm --filter @noname/electron dev
set "DEV_CODE=%errorlevel%"
if not "%DEV_CODE%"=="0" goto fail
endlocal
exit /b 0

:fail
echo.
echo Startup failed. Review the command output above.
pause
endlocal
exit /b 1
