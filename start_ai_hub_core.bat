
@echo off
color 1F
title AI Hub Core Launcher

:: Set debug log file
set "DEBUG_LOG=C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\debug_core.txt"
echo Starting AI Hub Core Launcher at %date% %time% > "%DEBUG_LOG%" 2>&1
echo Environment: PATH=%PATH% >> "%DEBUG_LOG%" 2>&1
echo Time format: %time% >> "%DEBUG_LOG%" 2>&1

echo.
echo ========================================
echo        AI HUB CORE LAUNCHER
echo ========================================
echo. >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1
echo        AI HUB CORE LAUNCHER >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1

setlocal EnableDelayedExpansion
set "start_time=%time%"
echo Start time: !start_time! >> "%DEBUG_LOG%" 2>&1

cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack"
echo Changed directory to %CD%, errorlevel: %errorlevel% >> "%DEBUG_LOG%" 2>&1

echo Checking for Python...
echo Checking for Python... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
where python >nul 2>&1 || (
    echo ERROR: Python not found! Please install Python 3.11 or 3.12.
    echo ERROR: Python not found at %time% >> "%DEBUG_LOG%" 2>&1
    pause
    exit /b 1
)
set "err=%errorlevel%"
echo where python completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for Python check >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done checking Python ... (!elapsed_time! sec)
echo Done checking Python ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

echo Checking if Ollama is installed...
echo Checking if Ollama is installed... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
ollama --version >nul 2>&1
set "err=%errorlevel%"
echo ollama --version completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
if errorlevel 1 (
    echo ERROR: Ollama not found!
    echo ERROR: Ollama not found at %time% >> "%DEBUG_LOG%" 2>&1
    echo Please install Ollama from: https://ollama.ai/
    pause
    exit /b 1
)
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for Ollama check >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done checking Ollama installation ... (!elapsed_time! sec)
echo Done checking Ollama installation ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1
echo ✓ Ollama is installed
echo ✓ Ollama is installed >> "%DEBUG_LOG%" 2>&1

echo Setting up the virtual environment...
echo Setting up the virtual environment... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
if not exist "venv" (
    python -m venv venv
    set "err=%errorlevel%"
    echo python -m venv completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
    echo ✓ Virtual environment created
    echo ✓ Virtual environment created >> "%DEBUG_LOG%" 2>&1
) else (
    echo ✓ Virtual environment already exists
    echo ✓ Virtual environment already exists >> "%DEBUG_LOG%" 2>&1
)
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for virtual environment >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done setting up virtual environment ... (!elapsed_time! sec)
echo Done setting up virtual environment ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

echo Activating the virtual environment...
echo Activating the virtual environment... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
call venv\Scripts\activate
set "err=%errorlevel%"
echo venv activation completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for venv activation >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done activating virtual environment ... (!elapsed_time! sec)
echo Done activating virtual environment ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

echo Checking if dependencies are installed...
echo Checking if dependencies are installed... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
pip check >nul 2>&1
set "err=%errorlevel%"
echo pip check completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
if errorlevel 1 (
    echo Installing required Python libraries...
    echo Installing required Python libraries... >> "%DEBUG_LOG%" 2>&1
    python -m pip install --upgrade pip --quiet
    set "err=%errorlevel%"
    echo pip upgrade completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
    python -m pip install -r requirements.txt --quiet
    set "err=%errorlevel%"
    echo pip install requirements.txt completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies from requirements.txt
        echo ERROR: Failed to install dependencies at %time% >> "%DEBUG_LOG%" 2>&1
        pause
        exit /b 1
    )
    echo ✓ All Python libraries installed successfully
    echo ✓ All Python libraries installed successfully >> "%DEBUG_LOG%" 2>&1
) else (
    echo ✓ Dependencies already satisfied
    echo ✓ Dependencies already satisfied >> "%DEBUG_LOG%" 2>&1
)
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for dependency check >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done checking/installing dependencies ... (!elapsed_time! sec)
echo Done checking/installing dependencies ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

echo Checking TextGen WebUI...
echo Checking TextGen WebUI... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
curl -s -f http://127.0.0.1:5001 >nul 2>&1
set "err=%errorlevel%"
echo curl check for TextGen WebUI, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
if errorlevel 1 (
    echo WARNING: TextGen WebUI not responding on http://127.0.0.1:5001. Continuing anyway.
    echo WARNING: TextGen WebUI not responding at %time% >> "%DEBUG_LOG%" 2>&1
)
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for TextGen WebUI check >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done checking TextGen WebUI ... (!elapsed_time! sec)
echo Done checking TextGen WebUI ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

echo Checking Ollama server...
echo Checking Ollama server... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
tasklist /fi "imagename eq ollama.exe" | find "ollama.exe" > nul
set "err=%errorlevel%"
echo tasklist check for Ollama, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
if errorlevel 1 (
    echo WARNING: Ollama server not running. Attempting to start...
    echo WARNING: Ollama server not running at %time% >> "%DEBUG_LOG%" 2>&1
    start "Ollama" ollama serve
    set "err=%errorlevel%"
    echo ollama serve launched, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
    timeout /t 5 /nobreak >nul
    set "err=%errorlevel%"
    echo timeout completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
)
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for Ollama server check >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done checking Ollama server ... (!elapsed_time! sec)
echo Done checking Ollama server ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

echo.
echo ========================================
echo        STARTING AI HUB GATEWAY
echo ========================================
echo. >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1
echo        STARTING AI HUB GATEWAY >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1
echo.
echo Launching AI Hub Gateway...
echo URL: http://localhost:7860 (or next available port)
echo.
echo Launching AI Hub Gateway... >> "%DEBUG_LOG%" 2>&1
echo URL: http://localhost:7860 (or next available port) >> "%DEBUG_LOG%" 2>&1
echo.
echo The gateway will give you access to:
echo - Podcast Generator (Audio)
echo - RAG Q^&A System (Documents)
echo - General AI Assistant (Chat)
echo - Combined AI Systems (Both)
echo - Multi-Agent System (Specialized)
echo - Text Generation UI (Advanced LLM)
echo.
echo The gateway will give you access to: >> "%DEBUG_LOG%" 2>&1
echo - Podcast Generator (Audio) >> "%DEBUG_LOG%" 2>&1
echo - RAG Q^&A System (Documents) >> "%DEBUG_LOG%" 2>&1
echo - General AI Assistant (Chat) >> "%DEBUG_LOG%" 2>&1
echo - Combined AI Systems (Both) >> "%DEBUG_LOG%" 2>&1
echo - Multi-Agent System (Specialized) >> "%DEBUG_LOG%" 2>&1
echo - Text Generation UI (Advanced LLM) >> "%DEBUG_LOG%" 2>&1
echo.
echo PDF processing will continue in the background.
echo PDF processing will continue in the background. >> "%DEBUG_LOG%" 2>&1
echo.

set "step_start=%time%"
python multi_ai_app.py
set "err=%errorlevel%"
echo python multi_ai_app.py completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for AI Hub Gateway launch >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done launching AI Hub Gateway ... (!elapsed_time! sec)
echo Done launching AI Hub Gateway ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

echo.
echo ========================================
echo        APPLICATION CLOSED
========================================
echo. >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1
echo        APPLICATION CLOSED >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1
echo.
echo The AI Hub has been closed.
echo The AI Hub has been closed. >> "%DEBUG_LOG%" 2>&1
call venv\Scripts\deactivate
set "err=%errorlevel%"
echo venv deactivation completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1

call :CalculateTime "!start_time!" || (
    echo ERROR: CalculateTime failed for total time >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Total core launch time ... (!elapsed_time! sec)
echo Total core launch time ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

endlocal
pause
goto :eof

:error
echo ERROR: Script failed, check %DEBUG_LOG% for details
echo ERROR: Script failed at %time% >> "%DEBUG_LOG%" 2>&1
endlocal
pause
exit /b 1

:CalculateTime
setlocal EnableDelayedExpansion
set "start=%~1"
set "end_time=%time%"
echo CalculateTime: start=%start%, end=%end_time% >> "%DEBUG_LOG%" 2>&1
if "!start!"=="" (
    echo CalculateTime: Empty start time >> "%DEBUG_LOG%" 2>&1
    endlocal
    exit /b 1
)
if "!end_time!"=="" (
    echo CalculateTime: Empty end time >> "%DEBUG_LOG%" 2>&1
    endlocal
    exit /b 1
)
set "start=%start: =0%"
set "end=%end_time: =0%"
for /f "tokens=1-4 delims=:. " %%a in ("!start!") do (
    set "start_h=%%a"
    set "start_m=%%b"
    set "start_s=%%c"
    set "start_ms=%%d"
)
for /f "tokens=1-4 delims=:. " %%a in ("!end!") do (
    set "end_h=%%a"
    set "end_m=%%b"
    set "end_s=%%c"
    set "end_ms=%%d"
)
echo CalculateTime: start_h=!start_h!, start_m=!start_m!, start_s=!start_s!, start_ms=!start_ms! >> "%DEBUG_LOG%" 2>&1
echo CalculateTime: end_h=!end_h!, end_m=!end_m!, end_s=!end_s!, end_ms=!end_ms! >> "%DEBUG_LOG%" 2>&1
if "!start_h!"=="" set "start_h=0"
if "!start_m!"=="" set "start_m=0"
if "!start_s!"=="" set "start_s=0"
if "!start_ms!"=="" set "start_ms=0"
if "!end_h!"=="" set "end_h=0"
if "!end_m!"=="" set "end_m=0"
if "!end_s!"=="" set "end_s=0"
if "!end_ms!"=="" set "end_ms=0"
set /a start_h=1!start_h!-100
set /a start_m=1!start_m!-100
set /a start_s=1!start_s!-100
set /a start_ms=1!start_ms!-100
set /a end_h=1!end_h!-100
set /a end_m=1!end_m!-100
set /a end_s=1!end_s!-100
set /a end_ms=1!end_ms!-100
echo CalculateTime: Numeric start_h=!start_h!, start_m=!start_m!, start_s=!start_s!, start_ms=!start_ms! >> "%DEBUG_LOG%" 2>&1
echo CalculateTime: Numeric end_h=!end_h!, end_m=!end_m!, end_s=!end_s!, end_ms=!end_ms! >> "%DEBUG_LOG%" 2>&1
set /a start_total=(start_h*3600 + start_m*60 + start_s)*100 + start_ms
set /a end_total=(end_h*3600 + end_m*60 + end_s)*100 + end_ms
set /a elapsed_total=end_total - start_total
if !elapsed_total! lss 0 set /a elapsed_total+=24*3600*100
set /a elapsed_time=elapsed_total / 100
set /a elapsed_time_dec=elapsed_total %% 100
if !elapsed_time_dec! lss 10 set "elapsed_time_dec=0!elapsed_time_dec!"
set "elapsed_time=!elapsed_time!.!elapsed_time_dec!"
echo CalculateTime: Result elapsed_time=!elapsed_time! >> "%DEBUG_LOG%" 2>&1
endlocal & set "elapsed_time=%elapsed_time%"
exit /b 0
