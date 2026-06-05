@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 🚀 正在启动 Learning Assistant...
echo.
echo 首次启动可能需要几分钟下载依赖，请耐心等待...
echo 如果启动失败，请确保已安装 Node.js: https://nodejs.org
echo.
call npm run dev
pause
