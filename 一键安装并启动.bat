@echo off
rem - 如果找不到 Node.js，使用 winget 安装 Node.js LTS。Node.js 安装包通常会自带 npm。
rem - 如果找不到 pnpm，执行 npm install -g pnpm 安装 pnpm。
rem - 检查 Node.js 是否达到 22.12.0。
rem - 执行 pnpm install，安装项目工作区依赖。
rem - 下载或准备 Electron 运行文件。
rem - 构建 @noname/fs 和 Electron。
rem - 启动 8082 联机服务器以及 Electron 开发环境。

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

rem Start the online WebSocket server on port 8082 in its own window.
start "Noname Online Server (8082)" /D "%~dp0" cmd /k "pnpm --filter @noname/server dev"

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
