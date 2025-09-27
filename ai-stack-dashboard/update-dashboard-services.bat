@echo off
cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\ai-stack-dashboard"

echo Updating dashboard services configuration...
echo.

:: Create updated server.js with test commands
(
echo const express = require('express');
echo const { exec } = require('child_process');
echo const app = express();
echo const PORT = 3000;
echo 
echo app.use(express.static('public'));
echo app.use(express.json());
echo 
echo // AI Services Configuration - Using simple test servers
echo const services = {
echo   meloTTS: {
echo     name: "MeloTTS",
echo     path: "C:/Users/sgins/AI_STACK/MeloTTS",
echo     startCommand: "python test_server.py",
echo     stopCommand: "taskkill /f /im python.exe",
echo     port: 8001,
echo     webInterface: true,
echo     description: "Text-to-Speech synthesis"
echo   },
echo   openManus: {
echo     name: "OpenManus", 
echo     path: "C:/Users/sgins/AI_STACK/OpenManus",
echo     startCommand: "python test_server.py",
echo     stopCommand: "taskkill /f /im python.exe", 
echo     port: 8002,
echo     webInterface: true,
echo     description: "AI agent framework"
echo   },
echo   openSora: {
echo     name: "OpenSora",
echo     path: "C:/Users/sgins/AI_STACK/OpenSora",
echo     startCommand: "python test_server.py",
echo     stopCommand: "taskkill /f /im python.exe",
echo     port: 8003, 
echo     webInterface: true,
echo     description: "Video generation AI"
echo   }
echo };
echo 
echo app.get('/', (req, res) => {
echo   res.sendFile(__dirname + '/public/index.html');
echo });
echo 
echo app.get('/api/services', (req, res) => {
echo   res.json(services);
echo });
echo 
echo app.post('/api/service/:name/start', (req, res) => {
echo   const serviceName = req.params.name;
echo   const service = services[serviceName];
echo   
echo   if (!service) {
echo     return res.json({ success: false, error: 'Service not found' });
echo   }
echo 
echo   const command = "cd \"" + service.path + "\" && start cmd /k " + service.startCommand;
echo   
echo   exec(command, (error, stdout, stderr) => {
echo     if (error) {
echo       res.json({ success: false, error: error.message });
echo     } else {
echo       res.json({ success: true, message: 'Starting ' + service.name });
echo     }
echo   });
echo });
echo 
echo app.post('/api/service/:name/stop', (req, res) => {
echo   const serviceName = req.params.name;
echo   const service = services[serviceName];
echo   
echo   if (!service) {
echo     return res.json({ success: false, error: 'Service not found' });
echo   }
echo 
echo   exec(service.stopCommand, (error, stdout, stderr) => {
echo     if (error) {
echo       res.json({ success: false, error: error.message });
echo     } else {
echo       res.json({ success: true, message: 'Stopped ' + service.name });
echo     }
echo   });
echo });
echo 
echo app.listen(PORT, () => {
echo   console.log('AI Dashboard running on http://localhost:' + PORT);
echo   console.log('Test services available on ports 8001-8003');
echo });
) > server.js

echo ✅ Dashboard updated!
echo.
echo Now run these steps:
echo 1. Run setup-ai-services.bat (to create test servers)
echo 2. Start your dashboard: node server.js
echo 3. Use the dashboard to start the test services
echo.
pause