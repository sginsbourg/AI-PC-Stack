@echo off
cd /d "%~dp0" & cls & color 0A & title merging mp3 files
set PATH=%PATH%;C:\ffmpeg\bin

setlocal enabledelayedexpansion

REM Load configuration values
set "MP3_FOLDER=mp3"
set "OUTPUT_NAME=Testing AI-Based Software Systems - From Theory to Practice - Shay Ginsbourg.mp3"

:: Check if mp3 subfolder exists
if not exist "%MP3_FOLDER%\" (
    echo Error: MP3 folder not found!
    echo Expected path: %MP3_FOLDER%
    pause
    exit /b 1
)

:: Check if FFmpeg is installed
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: FFmpeg is not installed or not in PATH!
    echo Please ensure FFmpeg is installed at C:\ffmpeg\bin
    pause
    exit /b 1
)

:: Create temporary file list
set "list_file=%temp%\mp3_list.txt"
del "%list_file%" 2>nul

:: Get sorted list of MP3 files
for /f "delims=" %%f in ('dir /b /o:n "%MP3_FOLDER%\*.mp3" 2^>nul') do (
    echo file '%MP3_FOLDER:/=\\%/%%f' >> "%list_file%"
)

:: Check if any MP3 files were found
if not exist "%list_file%" (
    echo No MP3 files found in MP3 folder!
    echo Path: %MP3_FOLDER%
    pause
    exit /b 1
)

:: Count files
for /f %%i in ('find /c /v "" ^< "%list_file%" 2^>nul') do set count=%%i
if "%count%"=="0" (
    echo No MP3 files found in MP3 folder!
    echo Path: %MP3_FOLDER%
    del "%list_file%" 2>nul
    pause
    exit /b 1
)

echo Found %count% MP3 files. Merging...
echo Source folder: %MP3_FOLDER%
echo Output file: %OUTPUT_NAME%
echo.

:: Merge files using FFmpeg
ffmpeg -f concat -safe 0 -i "%list_file%" -c copy "%OUTPUT_NAME%"

:: Cleanup
del "%list_file%" 2>nul

if exist "%OUTPUT_NAME%" (
    echo.
    echo Success! Merged file created: %OUTPUT_NAME%
    echo Location: %~dp0
    start "" "%OUTPUT_NAME%"
) else (
    echo.
    echo Error: Merge failed!
)

TIMEOUT /T 10