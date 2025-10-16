@echo off
title Audio Generation
cd /d "%~dp0" & cls & color 0A

:: Extend PATH with required tools
set PATH=%PATH%;C:\Users\sgins\Python312;C:\Users\sgins\Python312\Scripts;C:\ffmpeg\bin;C:\Program Files\Git\bin;C:\Windows\System32;C:\Users\sgins\miniconda3\Scripts;C:\Windows\System32\WindowsPowerShell\v1.0

:: Upgrade pip
python.exe -m pip install --upgrade pip

:: Create and activate virtual environment
if not exist venv (
    echo Creating virtual environment...
    python.exe -m venv venv
)

call venv\Scripts\activate.bat

:: Install required packages
echo Installing required packages...
pip install edge-tts pydub

:: Run the Python script
echo Running AI slide audio generator...
python generate_slide_audio.py

:: Verify output files
set OUTPUT_DIR=mp3
set /a EXPECTED_COUNT=40

if not exist "%OUTPUT_DIR%" (
    echo ERROR: Output folder '%OUTPUT_DIR%' was not created.
    goto :end
)

for /f %%i in ('dir /b "%OUTPUT_DIR%\*.mp3" 2^>nul ^| find /c /v ""') do set ACTUAL_COUNT=%%i

if "%ACTUAL_COUNT%"=="%EXPECTED_COUNT%" (
    echo.
    echo ✅ SUCCESS: All %EXPECTED_COUNT% audio files were generated in '%OUTPUT_DIR%'.
) else (
    echo.
    echo ⚠️ WARNING: Expected %EXPECTED_COUNT% files, but found %ACTUAL_COUNT% in '%OUTPUT_DIR%'.
    if %ACTUAL_COUNT% LSS 1 (
        echo          No MP3 files were created. Please check the input file format and script logic.
    )
)

:end
call venv\Scripts\deactivate.bat

echo.
echo Done. Press any key to exit.
pause >nul