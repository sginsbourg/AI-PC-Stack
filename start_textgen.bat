@echo off
title TextGen WebUI Launcher

echo.
echo Starting TextGen WebUI...
echo.

start /B C:\Users\sgins\AI_STACK\tg-webui\start_windows.bat

echo Waiting for TextGen WebUI to start...
timeout /t 10 /nobreak >nul

echo ✓ TextGen WebUI started on http://127.0.0.1:5001
echo.
