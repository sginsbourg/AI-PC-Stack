@echo off
chcp 65001 >nul

cd /d "%~dp0" & cls & color 0A

echo.
echo 🔍 Simple File Check - AI Lead Finder
echo.

echo 📁 Checking critical files:
if exist "docker-compose.yml" (echo ✅ docker-compose.yml) else (echo ❌ docker-compose.yml)
if exist "setup.bat" (echo ✅ setup.bat) else (echo ❌ setup.bat) 
if exist "main_enhanced.py" (echo ✅ main_enhanced.py) else (echo ❌ main_enhanced.py)
if exist "open-manus\app.py" (echo ✅ open-manus\app.py) else (echo ❌ open-manus\app.py)
if exist "lead-analyzer\analyzer.py" (echo ✅ lead-analyzer\analyzer.py) else (echo ❌ lead-analyzer\analyzer.py)

echo.
echo 📁 Checking directories:
if exist "scripts\" (echo ✅ scripts\) else (echo ❌ scripts\)
if exist "open-manus\" (echo ✅ open-manus\) else (echo ❌ open-manus\)
if exist "lead-analyzer\" (echo ✅ lead-analyzer\) else (echo ❌ lead-analyzer\)
if exist "nutch_data\" (echo ✅ nutch_data\) else (echo ❌ nutch_data\)

echo.
echo 💡 Next steps:
echo   1. Run 'create_missing_files_fixed.bat' to create missing files
echo   2. Run 'verify_setup_fixed.bat' to verify complete setup
echo   3. Run 'setup.bat' to start the system
echo.
pause