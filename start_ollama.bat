@echo off
title Ollama Server Launcher

echo.
echo Checking if Ollama is running...
tasklist /fi "imagename eq ollama.exe" | find "ollama.exe" > nul
if errorlevel 1 (
    echo Starting Ollama server...
    start /B ollama serve
    timeout /t 10 /nobreak >nul
    echo ✓ Ollama server started
) else (
    echo ✓ Ollama server is already running
)
echo.
