@echo off
title 桌面日历 - 快速开发
echo 正在启动桌面日历...
cd /d "%~dp0"

REM 清理可能残留的进程
taskkill /f /im node.exe 2>nul
timeout /t 1 /nobreak >nul

echo 使用修复后的启动方式...
npm run dev-fixed