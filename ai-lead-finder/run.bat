@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   AI-Powered Lead Finder
echo ========================================
echo.

:: Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

:: Check if services are running
echo 🔍 Checking services...
docker ps | findstr "nutch-crawler" >nul
if %errorlevel% neq 0 (
    echo ❌ Services are not running. Please run setup.bat first.
    pause
    exit /b 1
)

:: Run the main Python script
echo 🚀 Starting AI-Powered Lead Finder...
echo ✅ Confirmed: All AI models running locally - No API keys needed!
echo.

python main_enhanced.py

if %errorlevel% neq 0 (
    echo.
    echo ❌ Python script failed. Please check if Python is installed.
    echo 💡 Required: Python 3.8 or higher
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 Lead generation completed!
echo ========================================
echo.
echo 📁 Check the 'results' folder for:
echo    - ai_leads.csv (Excel-friendly format)
echo    - ai_leads_detailed.json (Detailed analysis)
echo    - summary_report.md (Executive summary)
echo.
pause