@echo off
setlocal

:: ==============================
:: Orpheus-TTS Runner
:: Copies script, activates environment, and runs inference
:: ==============================

color 0A
title Orpheus-TTS Runner

set "SOURCE_SCRIPT=C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\orpheus_inference.py"
set "TARGET_DIR=C:\Users\sgins\AI_STACK\Orpheus-TTS"
set "VENV_PATH=%TARGET_DIR%\orpheus_env"
set "SCRIPT_NAME=orpheus_inference.py"

echo [+] Starting Orpheus-TTS synthesis...
echo.

:: Validate source script exists
if not exist "%SOURCE_SCRIPT%" (
    echo [!] ERROR: Source script not found:
    echo     %SOURCE_SCRIPT%
    echo.
    pause
    exit /b 1
)

:: Validate target directory exists
if not exist "%TARGET_DIR%" (
    echo [!] ERROR: Target directory not found:
    echo     %TARGET_DIR%
    echo.
    pause
    exit /b 1
)

:: Validate virtual environment exists
if not exist "%VENV_PATH%\Scripts\activate.bat" (
    echo [!] ERROR: Virtual environment not found:
    echo     %VENV_PATH%
    echo.
    pause
    exit /b 1
)

:: Copy the inference script
echo [+] Copying %SCRIPT_NAME% to target directory...
copy /Y "%SOURCE_SCRIPT%" "%TARGET_DIR%\%SCRIPT_NAME%" >nul
if errorlevel 1 (
    echo [!] ERROR: Failed to copy script.
    echo.
    pause
    exit /b 1
)

:: Run inference in the virtual environment
echo [+] Activating virtual environment and running inference...
echo.

cd /d "%TARGET_DIR%"
:: Use cmd /k to keep window open after execution for debugging
call "%VENV_PATH%\Scripts\activate.bat" && python "%SCRIPT_NAME%" "Hello world" "test.wav"

if errorlevel 1 (
    echo.
    echo [!] ERROR: Inference failed. Check the error above.
    echo.
    pause
    exit /b 1
)

echo.
echo [+] Success! Audio saved as 'test.wav'
echo.
pause