@echo off
setlocal

color 0A
title Installing Open Notebook on Windows

:: Open Notebook Installer for Windows
:: Based on: https://github.com/lfnovo/open-notebook/blob/main/docs/getting-started/installation.md

echo ==================================================
echo   Installing Open Notebook on Windows
echo ==================================================

:: Check if Python is installed and in PATH
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.10 or newer from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

:: Get Python version
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set pyver=%%v
echo Detected Python version: %pyver%

:: Basic version check (ensure at least 3.10)
for /f "tokens=1-3 delims=." %%a in ("%pyver%") do (
    set py_major=%%a
    set py_minor=%%b
)
if %py_major% LSS 3 (
    echo ERROR: Python 3.10+ is required. You have %pyver%.
    pause
    exit /b 1
)
if %py_major% EQU 3 if %py_minor% LSS 10 (
    echo ERROR: Python 3.10+ is required. You have %pyver%.
    pause
    exit /b 1
)

:: Check if Poetry is installed
poetry --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Poetry not found. Installing Poetry...
    powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" >nul 2>&1
    (curl -sSL https://install.python-poetry.org | python -) || (
        echo ERROR: Failed to install Poetry.
        pause
        exit /b 1
    )
)

:: Add Poetry to PATH for this session (Windows default install location)
set USERPROFILE_PATH=%USERPROFILE%
set POETRY_BIN=%USERPROFILE_PATH%\AppData\Roaming\Python\Scripts
if not exist "%POETRY_BIN%" set POETRY_BIN=%USERPROFILE_PATH%\.local\bin

:: Temporarily add Poetry to PATH
set PATH=%POETRY_BIN%;%PATH%

:: Clone the Open Notebook repository
if exist "open-notebook" (
    echo WARNING: 'open-notebook' folder already exists. Skipping clone.
) else (
    echo Cloning Open Notebook repository...
    git clone https://github.com/lfnovo/open-notebook.git
    if %errorlevel% neq 0 (
        echo ERROR: Failed to clone repository. Is Git installed?
        echo Download Git from https://git-scm.com/download/win
        pause
        exit /b 1
    )
)

:: Navigate into the project directory
cd open-notebook

:: Install dependencies using Poetry
echo Installing dependencies with Poetry...
poetry install
if %errorlevel% neq 0 (
    echo ERROR: Poetry install failed.
    pause
    exit /b 1
)

:: Launch Open Notebook
echo.
echo Installation complete! Starting Open Notebook...
poetry run notebook

echo.
echo If the app doesn't start, try running:
echo   cd open-notebook ^&^& poetry run notebook
pause