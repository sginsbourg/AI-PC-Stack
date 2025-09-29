@echo on
setlocal

color 0A
title Launching Open Notebook on Windows

:: === CONFIGURE THIS PATH ===
set "NOTEBOOK_DIR=C:\Users\sgins\open-notebook"
:: ===========================

if not exist "%NOTEBOOK_DIR%" (
    echo ERROR: Open Notebook directory not found at:
    echo   %NOTEBOOK_DIR%
    echo Please update the NOTEBOOK_DIR path in this batch file.
    pause
    exit /b 1
)

echo Launching Open Notebook from: %NOTEBOOK_DIR%
cd /d "%NOTEBOOK_DIR%"

:: Ensure Poetry is in PATH (default user install locations)
set "POETRY_BIN=%APPDATA%\Python\Scripts"
if exist "%POETRY_BIN%" set "PATH=%POETRY_BIN%;%PATH%"

set "POETRY_BIN2=%USERPROFILE%\.local\bin"
if exist "%POETRY_BIN2%" set "PATH=%POETRY_BIN2%;%PATH%"

:: Run the app
C:\Users\sgins\AppData\Roaming\Python\Scripts\poetry install
C:\Users\sgins\AppData\Roaming\Python\Scripts\poetry run python -m open_notebook.cli

if %errorlevel% neq 0 (
    echo.
    echo FAILED to start Open Notebook.
    echo Make sure you've run 'poetry install' in the open-notebook folder.
    pause
    exit /b 1
)