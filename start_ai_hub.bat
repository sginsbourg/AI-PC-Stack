@echo off
color 1F
title Local AI Hub

echo Starting Local AI Hub with Multiple AI Systems...

echo Checking if Ollama is installed...
ollama --version
if errorlevel 1 (
    echo ERROR: Ollama not found! Please install from https://ollama.ai/
    pause
    exit /b 1
)

echo Setting up the virtual environment...
python -m venv venv

echo Activating the virtual environment...
call venv\Scripts\activate

echo Installing required Python libraries...
pip install langchain langchain-community langchain-ollama pypdf chromadb gradio

echo Checking if Ollama is running...
tasklist /fi "imagename eq ollama.exe" | find "ollama.exe" > nul
if errorlevel 1 (
    echo Starting Ollama server...
    start /B ollama serve
    echo Waiting for Ollama to start...
    timeout /t 3
) else (
    echo Ollama is already running.
)

echo Pulling additional AI models...
echo Pulling llama2 for general AI...
ollama pull llama2

echo Starting Multi-AI Application...
python multi_ai_app.py

pause