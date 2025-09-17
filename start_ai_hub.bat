@echo off
color 1F
title AI Hub - Application Gateway

echo.
echo ========================================
echo        AI HUB APPLICATION GATEWAY
echo ========================================
echo.
echo This script will launch the AI Hub gateway.
echo From here you can access all AI applications.
echo.

cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack"

echo Checking for Python...
where python >nul 2>&1 || (
    echo ERROR: Python not found! Please install Python 3.11 or 3.12.
    pause
    exit /b 1
)

echo Checking if Ollama is installed...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ollama not found!
    echo Please install Ollama from: https://ollama.ai/
    pause
    exit /b 1
)
echo ✓ Ollama is installed

echo Setting up the virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)

echo Activating the virtual environment...
call venv\Scripts\activate

echo Installing required Python libraries...
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt --quiet || (
    echo ERROR: Failed to install dependencies from requirements.txt
    pause
    exit /b 1
)
echo ✓ All Python libraries installed successfully

echo Checking if Ollama is running...
tasklist /fi "imagename eq ollama.exe" | find "ollama.exe" > nul
if errorlevel 1 (
    echo Starting Ollama server...
    start /B ollama serve
    timeout /t 10 /nobreak >nul
)

echo.
echo ========================================
echo        STARTING AI HUB GATEWAY
echo ========================================
echo.
echo Launching AI Hub Gateway...
echo URL: http://localhost:7860
echo.
echo The gateway will give you access to:
echo - Podcast Generator (Audio)
echo - RAG Q^&A System (Documents)
echo - General AI Assistant (Chat)
echo - Combined AI Systems (Both)
echo - Multi-Agent System (Specialized)
echo.
echo PDF processing will continue in the background.
echo.

python multi_ai_app.py

echo.
echo ========================================
echo        APPLICATION CLOSED
echo ========================================
echo.
echo The AI Hub has been closed.
call venv\Scripts\deactivate
pause