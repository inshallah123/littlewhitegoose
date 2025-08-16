@echo off
title 桌面日历 - 修复版
echo 正在启动桌面日历 (修复竞态条件)...
cd /d "%~dp0"

REM 设置轻量环境变量
set NODE_ENV=development
set PORT=3002
set BROWSER=none
set GENERATE_SOURCEMAP=false
set FAST_REFRESH=false

echo 启动 React 开发服务器...
start /B npm run start-minimal

echo 等待服务器就绪...
:wait_loop
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3002' -UseBasicParsing -TimeoutSec 1; if($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    echo 服务器尚未就绪，继续等待...
    timeout /t 3 /nobreak >nul
    goto wait_loop
)

echo ✓ React 服务器已就绪！
echo 启动 Electron 应用...
npm run electron-only