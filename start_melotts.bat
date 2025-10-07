@echo off
color 0A
title MeloTTS Setup and Run

:: --- Configuration ---
set "PROJECT_DIR=C:\Users\sgins\AI_STACK\MeloTTS"
set "VENV_NAME=venv-melo"
set "PYTHON_SCRIPT=ai_voice_assistant.py"
set "REQUIREMENTS_FILE=requirements.txt"
set "OLLAMA_HOST=127.0.0.1:11435"

:: --- Change Directory ---
echo.
echo Changing directory to "%PROJECT_DIR%"...
if not exist "%PROJECT_DIR%" (
    echo [ERROR] Project directory not found: "%PROJECT_DIR%"
    pause
    exit /b 1
)
cd /d "%PROJECT_DIR%"


:: --- Create Virtual Environment ---
if not exist "%VENV_NAME%" (
    echo.
    echo Creating virtual environment "%VENV_NAME%"...
    python -m venv "%VENV_NAME%"
    if errorlevel 1 (
        echo [FATAL ERROR] Failed to create virtual environment.
        echo Please ensure Python is installed and accessible via the 'python' command.
        pause
        exit /b 1
    )
) else (
    echo.
    echo Virtual environment "%VENV_NAME%" already exists. Skipping creation.
)


:: --- Activate Virtual Environment ---
echo.
echo Activating virtual environment...
call "%VENV_NAME%\Scripts\activate.bat"
if errorlevel 1 (
    echo [FATAL ERROR] Failed to activate virtual environment.
    pause
    exit /b 1
)
echo Successfully activated "%VENV_NAME%".


:: --- Install Dependencies ---
echo.
echo Upgrading pip...
pip install --upgrade pip

if not exist "%REQUIREMENTS_FILE%" (
    echo [ERROR] Requirements file not found: "%REQUIREMENTS_FILE%"
    echo Cannot install dependencies.
    pause
) else (
    echo Installing/Updating dependencies from "%REQUIREMENTS_FILE%"...
    pip install -r "%REQUIREMENTS_FILE%"
    if errorlevel 1 (
        echo [ERROR] Failed to install Python dependencies. Check the requirements file and internet connection.
        pause
    )
)


:: --- Set Environment Variable ---
echo.
echo Setting OLLAMA_HOST environment variable to %OLLAMA_HOST%
set "OLLAMA_HOST=%OLLAMA_HOST%"


:: --- Run Python Script ---
echo.
echo Checking for main script: "%PYTHON_SCRIPT%"...
if not exist "%PYTHON_SCRIPT%" (
    echo [FATAL ERROR] Main Python script not found: "%PYTHON_SCRIPT%"
    pause
) else (
    echo Launching AI Voice Assistant...
    echo.
    python "%PYTHON_SCRIPT%"
)


:: --- Script Finished ---
echo.
echo Script execution finished.
pause