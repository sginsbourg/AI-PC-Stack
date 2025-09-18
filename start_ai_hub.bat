@echo off
color 1F
title ai_hub

setlocal enabledelayedexpansion

:: Step 1: Change to target directory
set "START1=%TIME%"
cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack"
if errorlevel 1 (
    echo ERROR: Could not change directory.
    goto :ERROR
)
set "END1=%TIME%"

:: Step 2: Create venv if not exists
set "START2=%TIME%"
if not exist venv (
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create venv.
        goto :ERROR
    )
)
set "END2=%TIME%"

:: Step 3: Activate venv
set "START3=%TIME%"
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Could not activate venv.
    goto :ERROR
)
set "END3=%TIME%"

:: Step 4: Upgrade pip (fixed command)
set "START4=%TIME%"
python -m pip install --upgrade pip
if errorlevel 1 (
    echo ERROR: Failed to upgrade pip.
    goto :ERROR
)
set "END4=%TIME%"

:: Step 5: Install requirements
set "START5=%TIME%"
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install requirements.
    goto :ERROR
)
set "END5=%TIME%"

:: Step 6: Run ai_hub.py
set "START6=%TIME%"
python ai_hub.py
if errorlevel 1 (
    echo ERROR: Failed to run ai_hub.py.
    goto :ERROR
)
set "END6=%TIME%"

:: Step 7: Deactivate venv (optional)
deactivate

:: Show timing info (basic)
echo.
echo Stage timings:
call :DisplayTime "CD to directory" %START1% %END1%
call :DisplayTime "Create venv" %START2% %END2%
call :DisplayTime "Activate venv" %START3% %END3%
call :DisplayTime "Upgrade pip" %START4% %END4%
call :DisplayTime "Install requirements" %START5% %END5%
call :DisplayTime "Run ai_hub.py" %START6% %END6%

goto :EOF

:DisplayTime
set "start=%2"
set "end=%3"
for /f "tokens=1-4 delims=:." %%a in ("%start%") do (
    set "sh=%%a"
    set "sm=%%b"
    set "ss=%%c"
    set "shs=%%d"
)
for /f "tokens=1-4 delims=:." %%a in ("%end%") do (
    set "eh=%%a"
    set "em=%%b"
    set "es=%%c"
    set "ehs=%%d"
)
set /a "starttotal=(sh*3600)+(sm*60)+ss"
set /a "endtotal=(eh*3600)+(em*60)+es"
set /a "secs = endtotal - starttotal"
echo %~1: !secs! sec
goto :EOF

:ERROR
echo Batch file terminated due to error.
pause
exit /b 1
