@echo off
chcp 65001 >nul

cd /d "%~dp0" & cls & color 0A

echo.
echo 🛑 Stopping AI Lead Finder Services...
echo.

docker-compose down

echo.
echo ✅ Services stopped
pause