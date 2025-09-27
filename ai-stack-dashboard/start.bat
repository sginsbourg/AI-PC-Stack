@echo off
title AI Dashboard
cd /d "%~dp0"

echo Starting AI Dashboard Server...
echo.

:: Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

:: Start the server
echo Server starting on http://localhost:3000
echo Keep this window open while using the dashboard
echo.
echo ===============================================
node server.js