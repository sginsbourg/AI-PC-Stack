
@echo off
color 1F
title AI Hub - Master Launcher

:: Set debug log file
set "DEBUG_LOG=C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\debug_ai_hub.txt"
echo Starting AI Hub Master Launcher at %date% %time% > "%DEBUG_LOG%" 2>&1
echo Environment: PATH=%PATH% >> "%DEBUG_LOG%" 2>&1
echo Time format: %time% >> "%DEBUG_LOG%" 2>&1

echo.
echo ========================================
echo        AI HUB MASTER LAUNCHER
echo ========================================
echo. >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1
echo        AI HUB MASTER LAUNCHER >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1

:: Enable delayed expansion
setlocal EnableDelayedExpansion

:: Get start time
set "start_time=%time%"
echo Start time: !start_time! >> "%DEBUG_LOG%" 2>&1

:: Start TextGen WebUI in parallel
echo Starting TextGen WebUI...
echo Starting TextGen WebUI... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
start "TextGen WebUI" start_textgen.bat
set "err=%errorlevel%"
echo start_textgen.bat launched, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for TextGen WebUI >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done starting TextGen WebUI ... (!elapsed_time! sec)
echo Done starting TextGen WebUI ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

:: Start Ollama server in parallel
echo Starting Ollama server...
echo Starting Ollama server... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
start "Ollama Server" start_ollama.bat
set "err=%errorlevel%"
echo start_ollama.bat launched, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for Ollama server >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done starting Ollama server ... (!elapsed_time! sec)
echo Done starting Ollama server ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

:: Wait briefly to ensure servers are starting
echo Waiting for servers to initialize...
echo Waiting for servers to initialize... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
timeout /t 5 /nobreak >nul
set "err=%errorlevel%"
echo timeout completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for timeout >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done waiting for servers ... (!elapsed_time! sec)
echo Done waiting for servers ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

:: Start the core AI Hub setup and application
echo Starting AI Hub Core...
echo Starting AI Hub Core... >> "%DEBUG_LOG%" 2>&1
set "step_start=%time%"
call start_ai_hub_core.bat
set "err=%errorlevel%"
echo start_ai_hub_core.bat completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
call :CalculateTime "!step_start!" || (
    echo ERROR: CalculateTime failed for AI Hub Core >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done starting AI Hub Core ... (!elapsed_time! sec)
echo Done starting AI Hub Core ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

echo.
echo ========================================
echo        ALL SERVICES LAUNCHED
echo ========================================
echo. >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1
echo        ALL SERVICES LAUNCHED >> "%DEBUG_LOG%" 2>&1
echo ======================================== >> "%DEBUG_LOG%" 2>&1

:: Calculate total time
call :CalculateTime "!start_time!" || (
    echo ERROR: CalculateTime failed for total time >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Total launch time ... (!elapsed_time! sec)
echo Total launch time ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1

endlocal
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

:: Log inputs
echo CalculateTime: start=%start%, end=%end_time% >> "%DEBUG_LOG%" 2>&1

:: Handle missing or malformed time strings
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

:: Replace spaces for consistent parsing
set "start=%start: =0%"
set "end=%end_time: =0%"

:: Parse time components (handle formats like "17:34:12.34" or "5:34:12.34")
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

:: Log parsed components
echo CalculateTime: start_h=!start_h!, start_m=!start_m!, start_s=!start_s!, start_ms=!start_ms! >> "%DEBUG_LOG%" 2>&1
echo CalculateTime: end_h=!end_h!, end_m=!end_m!, end_s=!end_s!, end_ms=!end_ms! >> "%DEBUG_LOG%" 2>&1

:: Validate components
if "!start_h!"=="" set "start_h=0"
if "!start_m!"=="" set "start_m=0"
if "!start_s!"=="" set "start_s=0"
if "!start_ms!"=="" set "start_ms=0"
if "!end_h!"=="" set "end_h=0"
if "!end_m!"=="" set "end_m=0"
if "!end_s!"=="" set "end_s=0"
if "!end_ms!"=="" set "end_ms=0"

:: Convert to numbers
set /a start_h=1!start_h!-100
set /a start_m=1!start_m!-100
set /a start_s=1!start_s!-100
set /a start_ms=1!start_ms!-100
set /a end_h=1!end_h!-100
set /a end_m=1!end_m!-100
set /a end_s=1!end_s!-100
set /a end_ms=1!end_ms!-100

:: Log numeric values
echo CalculateTime: Numeric start_h=!start_h!, start_m=!start_m!, start_s=!start_s!, start_ms=!start_ms! >> "%DEBUG_LOG%" 2>&1
echo CalculateTime: Numeric end_h=!end_h!, end_m=!end_m!, end_s=!end_s!, end_ms=!end_ms! >> "%DEBUG_LOG%" 2>&1

:: Calculate total hundredths of a second
set /a start_total=(start_h*3600 + start_m*60 + start_s)*100 + start_ms
set /a end_total=(end_h*3600 + end_m*60 + end_s)*100 + end_ms
set /a elapsed_total=end_total - start_total
if !elapsed_total! lss 0 set /a elapsed_total+=24*3600*100
set /a elapsed_time=elapsed_total / 100
set /a elapsed_time_dec=elapsed_total %% 100

:: Format with leading zero if needed
if !elapsed_time_dec! lss 10 set "elapsed_time_dec=0!elapsed_time_dec!"
set "elapsed_time=!elapsed_time!.!elapsed_time_dec!"

:: Log result
echo CalculateTime: Result elapsed_time=!elapsed_time! >> "%DEBUG_LOG%" 2>&1

endlocal & set "elapsed_time=%elapsed_time%"
exit /b 0
