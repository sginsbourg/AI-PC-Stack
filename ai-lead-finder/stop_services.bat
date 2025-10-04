@echo off
chcp 65001 >nul

echo.
echo 🛑 Stopping AI Lead Finder Services...
echo.

docker-compose down

if %errorlevel% equ 0 (
    echo ✅ All services stopped successfully
) else (
    echo ❌ Failed to stop some services
)

echo.
pause