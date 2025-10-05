@echo off
setlocal enabledelayedexpansion

title AI Dashboard Installation Wizard
color 0A
echo.
echo ===============================================
echo    AI SERVICES DASHBOARD - INSTALLATION
echo ===============================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run this script as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/6] Checking system requirements...
echo.

:: Check Windows version
ver | findstr "10.0" >nul
if %errorLevel% neq 0 (
    echo [WARNING] Windows 10 or 11 is recommended
)

:: Check architecture
echo [INFO] System Architecture:
wmic os get osarchitecture | findstr /v "OSArchitecture"
echo.

echo [2/6] Installing Node.js if needed...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Node.js not found. Downloading installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi' -OutFile 'nodejs-installer.msi'"
    if exist nodejs-installer.msi (
        echo [INFO] Installing Node.js...
        msiexec /i nodejs-installer.msi /quiet /norestart
        timeout /t 10 /nobreak >nul
        del nodejs-installer.msi
    ) else (
        echo [ERROR] Failed to download Node.js
        echo Please install Node.js manually from https://nodejs.org
        pause
        exit /b 1
    )
) else (
    echo [OK] Node.js is already installed
)

:: Refresh PATH to include newly installed Node.js
for /f "usebackq tokens=2*" %%i in (`reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH 2^>nul`) do set "SYSTEM_PATH=%%j"
set "PATH=%SYSTEM_PATH%;C:\Program Files\nodejs"

echo [3/6] Verifying Node.js installation...
node --version >nul