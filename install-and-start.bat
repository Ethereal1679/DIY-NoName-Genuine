@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-and-start.ps1" -Mode Electron -InstallOnly
if errorlevel 1 pause
endlocal
