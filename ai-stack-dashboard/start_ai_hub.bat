@echo off
color 0A
title AI Stack Dashboard
cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\ai-stack-dashboard"

echo Starting AI Stack Dashboard...
echo.

:: Start server
if nit exist server.js pause
start "AI Dashboard Server" node server.js

:: Wait for server
timeout /t 3 /nobreak >nul

:: Open browser
start http://localhost:3000

echo.
echo 🚀 AI Dashboard launched!
echo 📍 http://localhost:3000
echo.
echo Your AI tools are ready to manage!
echo.
:: Wait for server
timeout /t 30 /nobreak >nul