@echo off
title AI Dashboard Killer Utility
color 0C
cd /d "%~dp0"

echo.
echo === Forcibly Terminating AI Dashboard Processes ===
echo.

REM --- 1. Kill the Node.js processes (The dashboard and any stray child processes) ---
taskkill /IM node.exe /F 
if %errorlevel% equ 0 (
    echo [OK] node.exe processes terminated.
) else (
    echo [INFO] node.exe processes not found or could not be terminated.
)

REM --- 2. Kill the Java process (Apache Nutch) ---
taskkill /IM java.exe /F 
if %errorlevel% equ 0 (
    echo [OK] java.exe (Nutch) terminated.
) else (
    echo [INFO] java.exe (Nutch) not found or could not be terminated.
)

REM --- 3. Kill the Python processes (MeloTTS, OpenManus, OpenSora, tg-webui) ---
taskkill /IM python.exe /F
if %errorlevel% equ 0 (
    echo [OK] python.exe (Python services) terminated.
) else (
    echo [INFO] python.exe (Python services) not found or could not be terminated.
)

REM --- 4. Kill Streamlit processes (OpenManus, OpenSora) ---
taskkill /IM streamlit.exe /F
if %errorlevel% equ 0 (
    echo [OK] streamlit.exe processes terminated.
) else (
    echo [INFO] streamlit.exe processes not found or could not be terminated.
)

echo.
echo === Cleanup Complete ===
echo.
pause