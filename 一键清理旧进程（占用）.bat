@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: 自动请求管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在请求管理员权限...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set PORTS=8081 8082 8083 8084

echo ==== 清理前占用情况 ====
for %%P in (%PORTS%) do (
    set FOUND=0
    for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        set FOUND=1
        echo 端口 %%P 被 PID %%I 占用
    )
    if "!FOUND!"=="0" echo 端口 %%P 空闲
)

echo.
echo ==== 结束占用端口的进程 ====
for %%P in (%PORTS%) do (
    for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        echo 结束端口 %%P -^> PID %%I
        taskkill /F /PID %%I >nul 2>&1
    )
)

echo.
echo ==== 清理残留 node 进程 ====
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel%==0 (echo node 进程已清理) else (echo 无残留 node 进程)

echo.
echo ==== 清理后 ====
for %%P in (%PORTS%) do (
    netstat -ano | findstr ":%%P " | findstr "LISTENING" >nul
    if errorlevel 1 (echo 端口 %%P 已释放) else (echo 端口 %%P 仍被占用！)
)

echo.
pause