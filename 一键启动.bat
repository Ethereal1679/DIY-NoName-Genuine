@echo off
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"

where node >nul 2>nul || (
	winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements || goto fail
)
where pnpm >nul 2>nul || call npm install -g pnpm || goto fail

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-and-start.ps1" -Mode Electron -StartServer
if errorlevel 1 goto fail

rem Vite builds dist/app/main.js, but Electron must be launched explicitly with that entry.
rem This avoids Electron treating the project directory as the app and reporting a missing main.js.
set "ELECTRON_BIN=%~dp0apps\electron\node_modules\.bin\electron.cmd"
set "ELECTRON_ENTRY=%~dp0apps\electron\dist\app\main.js"
if not exist "%ELECTRON_BIN%" (
	echo Electron launcher not found: "%ELECTRON_BIN%"
	goto fail
)
if not exist "%ELECTRON_ENTRY%" (
	echo Electron entry not found: "%ELECTRON_ENTRY%"
	echo Rebuilding Electron files...
	pushd "%~dp0apps\electron"
	call pnpm build
	set "BUILD_CODE=%errorlevel%"
	popd
	if not "%BUILD_CODE%"=="0" goto fail
)

call "%ELECTRON_BIN%" "%ELECTRON_ENTRY%"
exit /b %errorlevel%

:fail
echo.
echo Environment installation failed.
pause
exit /b 1
