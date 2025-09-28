@echo off
setlocal EnableDelayedExpansion

color 0A
title Multi-Agent Load Testing Dashboard
set PATH=%PATH%;C:\Users\sgins\Python312;C:\Users\sgins\Python312\Scripts;C:\ffmpeg\bin;C:\Program Files\Git\bin;C:\Windows\System32;C:\Users\sgins\miniconda3\Scripts; & python.exe -m pip install --upgrade pip
cd /d "%~dp0" & set PATH=%PATH%;C:\Windows\System32\WindowsPowerShell\v1.0
cls

:: Set variables
set "ROOT_DIR=C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\multi-agent"
set "DASHBOARD_FILE=%ROOT_DIR%\dashboard\index.html"
set "TG_WEBUI_DIR=C:\Users\sgins\AI_STACK\tg-webui"
set "CONFIGS_DIR=%ROOT_DIR%\configs"
set "DOCKER_COMPOSE_FILE=%CONFIGS_DIR%\docker-compose.yml"

echo Launching Multi-Agent Load Testing Dashboard...

:: Check if dashboard file exists
if not exist "%DASHBOARD_FILE%" (
    echo ERROR: Dashboard file not found at %DASHBOARD_FILE%
    echo Please ensure the dashboard/index.html file exists in %ROOT_DIR%
    pause
    exit /b 1
)

:: Check if tg-webui is running, start if not
netstat -an | find "5000" >nul
if errorlevel 1 (
    echo Starting tg-webui AI server...
    start /B cmd /c "cd %TG_WEBUI_DIR% && python server.py --model deepseek-ai_DeepSeek-V3.1 --api"
    :: Wait for server to start
    timeout /t 5 >nul
    echo tg-webui started.
) else (
    echo tg-webui is already running on port 5000.
)

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

:: Check if docker-compose.yml exists
if not exist "%DOCKER_COMPOSE_FILE%" (
    echo ERROR: docker-compose.yml not found at %DOCKER_COMPOSE_FILE%
    echo Please ensure the configs folder contains docker-compose.yml.
    pause
    exit /b 1
)

:: Start Docker Compose services
echo Starting Docker Compose services...
cd "%CONFIGS_DIR%"
start /B cmd /c "docker-compose up"
echo Docker Compose services started (running in background).

:: Wait briefly for services to initialize
timeout /t 5 >nul

:: Launch dashboard in default browser
echo Opening dashboard in default browser...
start "" "%DASHBOARD_FILE%"

echo.
echo Dashboard launched successfully!
echo Access it at: file://%DASHBOARD_FILE%
echo Orchestrator API: http://localhost:3000/orchestrate
echo Grafana Metrics: http://localhost:3001
echo.
echo To stop services, run: cd %CONFIGS_DIR% && docker-compose down
echo To stop tg-webui, close its command window or use Task Manager.

pause
endlocal