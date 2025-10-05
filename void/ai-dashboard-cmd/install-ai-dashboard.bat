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
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js installation failed
    pause
    exit /b 1
)

echo [OK] Node.js version:
node --version
npm --version
echo.

echo [4/6] Creating AI Stack directory structure...
set "AI_STACK=%USERPROFILE%\AI_STACK"
if not exist "%AI_STACK%" (
    mkdir "%AI_STACK%"
    echo [OK] Created AI_STACK directory
) else (
    echo [OK] AI_STACK directory already exists
)

:: Create required subdirectories
for %%d in (
    "apache-nutch-1.21"
    "MeloTTS" 
    "OpenManus"
    "OpenSora"
    "tg-webui"
) do (
    if not exist "%AI_STACK%\%%~d" (
        mkdir "%AI_STACK%\%%~d"
        echo [OK] Created %%~d directory
    )
)
echo.

echo [5/6] Installing Python dependencies...
python --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [INFO] Installing Python packages...
    pip install torchaudio streamlit >nul 2>&1
    if %errorLevel% equ 0 (
        echo [OK] Python packages installed successfully
    ) else (
        echo [WARNING] Failed to install some Python packages
        echo You may need to install them manually later
    )
) else (
    echo [INFO] Python not found. Please install Python 3.8+ manually
)

echo [6/6] Finalizing installation...
echo.

:: Create desktop shortcut
set "DASHBOARD_DIR=%~dp0"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\AI Dashboard.lnk"

echo [INFO] Creating desktop shortcut...
powershell -Command "
$WshShell = New-Object -comObject WScript.Shell;
$Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%');
$Shortcut.TargetPath = 'cmd.exe';
$Shortcut.Arguments = '/c \"\"%DASHBOARD_DIR%launch-ai.bat\"\"';
$Shortcut.WorkingDirectory = '%DASHBOARD_DIR%';
$Shortcut.WindowStyle = 7;
$Shortcut.IconLocation = '%SystemRoot%\System32\SHELL32.dll,21';
$Shortcut.Description = 'AI Services Dashboard';
$Shortcut.Save()
"

if exist "%SHORTCUT_PATH%" (
    echo [OK] Desktop shortcut created
) else (
    echo [WARNING] Could not create desktop shortcut
)

:: Create service logs directory
if not exist "service_logs" (
    mkdir "service_logs"
    echo [OK] Created service logs directory
)

echo.
echo ===============================================
echo    INSTALLATION COMPLETE!
echo ===============================================
echo.
echo [SUCCESS] AI Services Dashboard has been installed!
echo.
echo Next steps:
echo 1. Double-click "AI Dashboard" on your desktop
echo 2. Or run "launch-ai.bat" in this folder
echo 3. Install your AI services in %AI_STACK%
echo.
echo Required AI Services:
echo - Apache Nutch 1.21 in %AI_STACK%\apache-nutch-1.21\
echo - MeloTTS in %AI_STACK%\MeloTTS\
echo - OpenManus in %AI_STACK%\OpenManus\ 
echo - OpenSora in %AI_STACK%\OpenSora\
echo - tg-webui in %AI_STACK%\tg-webui\
echo - Ollama (install from https://ollama.ai)
echo.
echo Press any key to launch the dashboard...
pause >nul

:: Launch the dashboard
echo.
echo Launching AI Services Dashboard...
timeout /t 2 /nobreak >nul
"launch-ai.bat"