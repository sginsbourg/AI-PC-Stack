@echo off
title AI Stack Dashboard Setup
color 0A

echo.
echo ===============================================
echo    AI Stack Dashboard Setup for Windows 11
echo ===============================================
echo.

:: Set variables
set "DASHBOARD_DIR=%CD%\ai-stack-dashboard"

echo [%time%] Starting AI Stack Dashboard setup...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/ first
    pause
    exit /b 1
)

:: Create project structure
echo [%time%] Creating project structure...

if not exist "%DASHBOARD_DIR%" mkdir "%DASHBOARD_DIR%"
if not exist "%DASHBOARD_DIR%\public" mkdir "%DASHBOARD_DIR%\public"

:: Create package.json
echo Creating package.json...
(
echo {
echo   "name": "ai-stack-dashboard",
echo   "version": "1.0.0",
echo   "main": "server.js",
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "socket.io": "^4.7.2"
echo   }
echo }
) > "%DASHBOARD_DIR%\package.json"

:: Create CORRECTED server.js
echo Creating server.js...
(
echo // AI Stack Dashboard Server
echo const express = require('express');
echo const http = require('http');
echo const socketIo = require('socket.io');
echo 
echo const app = express();
echo const server = http.createServer(app);
echo const io = socketIo(server);
echo 
echo app.use(express.static('public'));
echo 
echo // AI Services
echo const services = {
echo   meloTTS: { name: "MeloTTS", port: 8001, description: "Text-to-Speech" },
echo   openManus: { name: "OpenManus", port: 8002, description: "AI Agent Framework" },
echo   openSora: { name: "OpenSora", port: 8003, description: "Video Generation" },
echo   orpheusTTS: { name: "Orpheus-TTS", port: 8004, description: "Advanced TTS" },
echo   tgWebUI: { name: "Text Generation WebUI", port: 7860, description: "Local LLM" },
echo   ollama: { name: "Ollama", port: 11434, description: "LLM Manager" }
echo };
echo 
echo app.get('/', function(req, res) {
echo   res.sendFile(__dirname + '/public/index.html');
echo });
echo 
echo app.get('/api/services', function(req, res) {
echo   res.json(services);
echo });
echo 
echo io.on('connection', function(socket) {
echo   socket.emit('services-list', services);
echo });
echo 
echo const PORT = 3000;
echo server.listen(PORT, function() {
echo   console.log('AI Dashboard running on http://localhost:' + PORT);
echo });
) > "%DASHBOARD_DIR%\server.js"

:: Create simple HTML file
echo Creating index.html...
(
echo ^<html^>
echo ^<head^>
echo ^<title^>AI Stack Dashboard^</title^>
echo ^<style^>
echo body { font-family: Arial; margin: 40px; background: #f5f5f5; }
echo .container { max-width: 1200px; margin: 0 auto; }
echo .header { background: white; padding: 30px; border-radius: 10px; text-align: center; }
echo .service { background: white; margin: 10px; padding: 20px; border-radius: 5px; }
echo .btn { padding: 10px; margin: 5px; border: none; border-radius: 3px; cursor: pointer; }
echo .start { background: #4CAF50; color: white; }
echo .open { background: #2196F3; color: white; }
echo ^</style^>
echo ^<script src="/socket.io/socket.io.js"^>^</script^>
echo ^</head^>
echo ^<body^>
echo ^<div class="container"^>
echo ^<div class="header"^>
echo ^<h1^>AI Stack Dashboard^</h1^>
echo ^<p^>Manage your AI tools^</p^>
echo ^</div^>
echo ^<div id="services"^>Loading services...^</div^>
echo ^</div^>
echo ^<script^>
echo var socket = io();
echo socket.on('services-list', function(services) {
echo   var html = '';
echo   for (var key in services) {
echo     var service = services[key];
echo     html += '^<div class="service"^>';
echo     html += '^<h3^>' + service.name + '^</h3^>';
echo     html += '^<p^>' + service.description + '^</p^>';
echo     html += '^<p^>Port: ' + service.port + '^</p^>';
echo     html += '^<button class="btn start" onclick="startService(\\'' + key + '\\')"^>Start^</button^>';
echo     html += '^<button class="btn open" onclick="openService(' + service.port + ')"^>Open^</button^>';
echo     html += '^</div^>';
echo   }
echo   document.getElementById('services').innerHTML = html;
echo });
echo function startService(name) { alert('Starting: ' + name); }
echo function openService(port) { window.open('http://localhost:' + port); }
echo ^</script^>
echo ^</body^>
echo ^</html^>
) > "%DASHBOARD_DIR%\public\index.html"

:: Install dependencies
echo [%time%] Installing npm dependencies...
cd /d "%DASHBOARD_DIR%"
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies
    pause
    exit /b 1
)

echo.
echo ===============================================
echo    SETUP COMPLETED!
echo ===============================================
echo.
echo To start the dashboard:
echo 1. cd ai-stack-dashboard
echo 2. node server.js
echo 3. Open: http://localhost:3000
echo.
pause