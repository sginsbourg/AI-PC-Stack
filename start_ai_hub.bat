@echo off
color 1F
title AI Hub - Master Launcher

echo.
echo ========================================
echo        AI HUB MASTER LAUNCHER
echo ========================================
echo.
echo This script will launch the AI Hub and its dependencies in parallel.
echo.

:: Start TextGen WebUI in parallel
echo Starting TextGen WebUI...
start /B start_textgen.bat

:: Start Ollama server in parallel
echo Starting Ollama server...
start /B start_ollama.bat

:: Wait briefly to ensure servers are starting
timeout /t 5 /nobreak >nul

:: Start the core AI Hub setup and application
echo Starting AI Hub Core...
call start_ai_hub_core.bat

echo.
echo ========================================
echo        ALL SERVICES LAUNCHED
echo ========================================
echo.
