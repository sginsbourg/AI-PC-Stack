@echo off
title Multi-Agent
echo Starting Multi-Agent Article Generator...

:: Activate or create conda env
call C:\Users\sgins\miniconda3\Scripts\activate.bat crewai-env
if errorlevel 1 (
    echo Creating conda environment 'crewai-env'...
    call C:\Users\sgins\miniconda3\Scripts\conda.bat create -n crewai-env python=3.10 -y
    if errorlevel 1 (
        echo ERROR: Failed to create conda environment.
        pause
        exit /b 1
    )
    call C:\Users\sgins\miniconda3\Scripts\activate.bat crewai-env
)

:: Navigate to a directory, e.g., AI-PC-Stack
cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\multi-agent"
if errorlevel 1 (
    echo Creating directory...
    mkdir "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\multi-agent"
    cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\multi-agent"
)

:: Install dependencies
pip install crewai langchain-community langchain-openai streamlit pydantic duckduckgo-search
if errorlevel 1 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

:: Set OLLAMA_HOST if needed
set OLLAMA_HOST=127.0.0.1:11435

:: Run Streamlit app
echo Starting Multi-Agent Streamlit UI on http://localhost:8504
streamlit run multi_agent_app.py --server.port 8504
if errorlevel 1 (
    echo ERROR: Failed to start Streamlit.
    pause
    exit /b 1
)

pause