@echo off
color 1F
title Local AI Hub - Setup and Launch

echo.
echo ========================================
echo        LOCAL AI HUB SETUP
echo ========================================
echo.
echo This script will set up your Local AI Hub environment.
echo Please be patient as some steps may take several minutes.
echo.

echo Checking if Ollama is installed...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ollama not found!
    echo.
    echo Please install Ollama from: https://ollama.ai/
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)

echo ✓ Ollama is installed
echo.

echo Creating PDF directory...
if not exist "pdf" (
    mkdir pdf
    echo ✓ Created PDF directory: .\pdf\
    echo.
    echo Please add your PDF files to the 'pdf' folder, then restart the application.
    echo.
    pause
    exit /b 0
) else (
    echo ✓ PDF directory already exists: .\pdf\
)

echo.
echo Setting up the virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)

echo.
echo Activating the virtual environment...
call venv\Scripts\activate

echo.
echo Upgrading pip to latest version...
echo [This may take a moment...]
python -m pip install --upgrade pip --quiet
echo ✓ Pip upgraded successfully

echo.
echo Installing required Python libraries...
echo [This may take 2-3 minutes...]
echo Installing: langchain, langchain-community, langchain-ollama
python -m pip install langchain langchain-community langchain-ollama --quiet
echo Installing: pypdf, chromadb, gradio, PyPDF2
python -m pip install pypdf chromadb gradio PyPDF2 --quiet
echo ✓ All Python libraries installed successfully

echo.
echo Checking if Ollama is running...
tasklist /fi "imagename eq ollama.exe" | find "ollama.exe" > nul
if errorlevel 1 (
    echo Starting Ollama server...
    echo [This will run in background]
    start /B ollama serve
    echo Waiting for Ollama to start...
    timeout /t 5 /nobreak >nul
) else (
    echo ✓ Ollama is already running
)

echo.
echo ========================================
echo        DOWNLOADING AI MODELS
echo ========================================
echo.
echo This is the longest part - please be patient!
echo Large AI models will be downloaded (several GB).
echo This may take 10-30 minutes depending on your internet speed.
echo.

echo Downloading llama2 for general AI...
echo [This may take 5-15 minutes...]
ollama pull llama2
echo ✓ llama2 model downloaded successfully

echo.
echo Downloading qwen:0.5b for RAG system...
echo [This may take 3-10 minutes...]
ollama pull qwen:0.5b
echo ✓ qwen:0.5b model downloaded successfully

echo.
echo ========================================
echo        STARTING AI APPLICATION
echo ========================================
echo.
echo All setup complete! Starting the Local AI Hub...
echo.
echo The application will open in your web browser.
echo URL: http://localhost:7860
echo.
echo IMPORTANT: Keep this window open while using the AI Hub.
echo.

echo Checking for PDF files...
dir pdf\*.pdf >nul 2>&1
if errorlevel 1 (
    echo.
    echo WARNING: No PDF files found in the 'pdf' directory!
    echo.
    echo Please add PDF files to the 'pdf' folder, then restart the application.
    echo.
    pause
    exit /b 0
) else (
    echo ✓ PDF files found in directory
)

echo.
echo Loading PDF files and initializing AI systems...
echo [This may take 1-2 minutes...]
echo - Scanning PDF directory...
echo - Building knowledge base...
echo - Initializing AI models...
echo.

echo Starting Multi-AI Application...
python multi_ai_app.py

echo.
echo ========================================
echo        APPLICATION CLOSED
echo ========================================
echo.
echo The Local AI Hub has been closed.
echo.
echo To restart, you can:
echo 1. Run this batch file again, OR
echo 2. Run: python multi_ai_app.py (after activating venv)
echo.
echo Virtual environment deactivated.
call venv\Scripts\deactivate
pause
