@echo off
cls
REM --- Windows Batch Script for Electron GUI Installation and Launch ---
color 0A

echo.
echo ==========================================================
echo AI SERVICES DASHBOARD GUI SETUP
echo ==========================================================
echo.

REM Navigate to the project directory (ensure the script is run from the project root)
cd /d "%~dp0"
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\Java\jdk-24\bin"
if not exist "C:\Program Files\Java\jdk-24\bin\java.exe" pause
npm install && npm start
npm audit fix --force

REM 1. Check for npm installation using the robust || conditional operator
echo [1/3] Checking for Node Package Manager (NPM)...

REM If npm -v fails (returns errorlevel 1 or greater), the block in parentheses runs.
npm -v >nul 2>&1 || (
    echo [ERROR] NPM is not found.
    echo Please ensure Node.js is installed and included in your system PATH.
    goto :EXIT_SCRIPT
)
echo [OK] NPM found.

REM 2. Install Dependencies
echo.
echo [2/3] Installing Electron and project dependencies via NPM...
npm install
if errorlevel 1 (
    echo [ERROR] NPM install failed. Please check network and package.json.
    goto :EXIT_SCRIPT
)
echo [OK] Dependencies installed successfully.

REM 3. Start the Application
echo.
echo [3/3] Launching the AI Services Dashboard GUI (Electron)...
npm start
if errorlevel 1 (
    echo [ERROR] Application failed to start. Check main.js for errors in the console/log.
    goto :EXIT_SCRIPT
)

:EXIT_SCRIPT
echo.
pause