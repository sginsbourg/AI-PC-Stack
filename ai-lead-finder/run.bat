@echo off
chcp 65001 >nul

cd /d "%~dp0" & cls & color 0A

echo.
echo ========================================
echo   AI-Powered Lead Finder
echo ========================================
echo.

echo Step 1: Checking Docker...
docker version >nul 2>&1
if not %errorlevel% == 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)
echo ✅ Docker is running

echo.
echo Step 2: Checking services...
docker ps | findstr "nutch-crawler" >nul
if not %errorlevel% == 0 (
    echo ERROR: Services are not running. Please run setup.bat first.
    pause
    exit /b 1
)
echo ✅ Services are running

echo.
echo Step 3: Starting AI-Powered Lead Finder...
echo ✅ Confirmed: All AI models running locally - No API keys needed!
echo.

python main_enhanced.py

if not %errorlevel% == 0 (
    echo.
    echo ERROR: Python script failed. Please check if Python is installed.
    echo TIP: Required: Python 3.8 or higher
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Lead generation completed!
echo ========================================
echo.
echo 📁 Check the 'results' folder for:
echo    - ai_leads.csv (Excel-friendly format)
echo    - ai_leads_detailed.json (Detailed analysis)
echo    - summary_report.md (Executive summary)
echo.
pause