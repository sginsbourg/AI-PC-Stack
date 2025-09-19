@echo off
title Multi-Agent

echo Starting Multi-Agent Article Generator...

set PATH=%PATH%;C:\Users\sgins\Python312;C:\Users\sgins\Python312\Scripts;C:\ffmpeg\bin;C:\Program Files\Git\bin;C:\Windows\System32;C:\Users\sgins\miniconda3\Scripts; & python.exe -m pip install --upgrade pip

:: Check if conda is available
where conda >nul 2>&1
if errorlevel 1 (
    echo ERROR: Conda not found. Please install Miniconda or ensure conda is in PATH.
    pause
    exit /b 1
)

:: Determine conda base path
for /f "tokens=*" %%i in ('conda info --base') do set "CONDA_BASE=%%i"
if not exist "%CONDA_BASE%\Scripts\conda.exe" (
    echo ERROR: Conda base path %CONDA_BASE% is invalid or conda.exe not found.
    pause
    exit /b 1
)

:: Accept ToS for Anaconda channels
echo Accepting Anaconda channel Terms of Service...
call "%CONDA_BASE%\Scripts\conda.exe" tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main
call "%CONDA_BASE%\Scripts\conda.exe" tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r
call "%CONDA_BASE%\Scripts\conda.exe" tos accept --override-channels --channel https://repo.anaconda.com/pkgs/msys2

:: Activate conda env
call "%CONDA_BASE%\Scripts\activate.bat" crewai-env
if errorlevel 1 (
    echo Creating conda environment 'crewai-env'...
    call "%CONDA_BASE%\Scripts\conda.exe" create -n crewai-env python=3.10 -y -c conda-forge
    if errorlevel 1 (
        echo ERROR: Failed to create conda environment.
        pause
        exit /b 1
    )
    call "%CONDA_BASE%\Scripts\activate.bat" crewai-env
    if errorlevel 1 (
        echo ERROR: Failed to activate conda environment 'crewai-env'.
        pause
        exit /b 1
    )
)

:: Navigate to Multi-Agent directory
cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\multi-agent"
if errorlevel 1 (
    echo Creating directory...
    mkdir "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\multi-agent"
    cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\multi-agent"
    if errorlevel 1 (
        echo ERROR: Could not change to or create Multi-Agent directory.
        pause
        exit /b 1
    )
)

:: Install dependencies
pip install crewai==0.30.11 langchain-community==0.0.38 langchain-openai==0.1.7 streamlit==1.36.0 pydantic==2.7.1 duckduckgo-search==5.3.0
if errorlevel 1 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

:: Set OLLAMA_HOST
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