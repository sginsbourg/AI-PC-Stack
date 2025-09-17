
@echo off
title Ollama Server Launcher

:: Set debug log file
set "DEBUG_LOG=C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\debug_ollama.txt"
echo Starting Ollama Server Launcher at %date% %time% > "%DEBUG_LOG%" 2>&1
echo Environment: PATH=%PATH% >> "%DEBUG_LOG%" 2>&1
echo Time format: %time% >> "%DEBUG_LOG%" 2>&1

echo.
echo Checking if Ollama is running...
echo. >> "%DEBUG_LOG%" 2>&1
echo Checking if Ollama is running... >> "%DEBUG_LOG%" 2>&1

setlocal EnableDelayedExpansion
set "start_time=%time%"
echo Start time: !start_time! >> "%DEBUG_LOG%" 2>&1

tasklist /fi "imagename eq ollama.exe" | find "ollama.exe" > nul
set "err=%errorlevel%"
echo tasklist check, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
if errorlevel 1 (
    echo Starting Ollama server...
    echo Starting Ollama server... >> "%DEBUG_LOG%" 2>&1
    set "ollama_start=%time%"
    start "Ollama" ollama serve
    set "err=%errorlevel%"
    echo ollama serve launched, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
    timeout /t 5 /nobreak >nul
    set "err=%errorlevel%"
    echo timeout completed, errorlevel: !err! >> "%DEBUG_LOG%" 2>&1
    call :CalculateTime "!ollama_start!" || (
        echo ERROR: CalculateTime failed for Ollama server >> "%DEBUG_LOG%" 2>&1
        goto :error
    )
    echo Done starting Ollama server ... (!elapsed_time! sec)
    echo Done starting Ollama server ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1
    echo ✓ Ollama server started
    echo ✓ Ollama server started >> "%DEBUG_LOG%" 2>&1
) else (
    echo ✓ Ollama server is already running
    echo ✓ Ollama server is already running >> "%DEBUG_LOG%" 2>&1
)

call :CalculateTime "!start_time!" || (
    echo ERROR: CalculateTime failed for total time >> "%DEBUG_LOG%" 2>&1
    goto :error
)
echo Done checking Ollama ... (!elapsed_time! sec)
echo Done checking Ollama ... (!elapsed_time! sec) >> "%DEBUG_LOG%" 2>&1
echo.

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
