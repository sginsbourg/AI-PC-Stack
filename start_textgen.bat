@echo off
title TextGen WebUI Launcher

:: Initialize debug log
set "LOG_FILE=%~dp0debug.txt"
echo [%date% %time%] Starting start_textgen.bat >> "%LOG_FILE%" 2>&1

echo.
echo Starting TextGen WebUI...
setlocal EnableDelayedExpansion
set "start_time=%time%"
echo [%date% %time%] Start time: %start_time% >> "%LOG_FILE%" 2>&1

start "TextGen WebUI Server" C:\Users\sgins\AI_STACK\tg-webui\start_windows.bat
echo [%date% %time%] Launched start_windows.bat >> "%LOG_FILE%" 2>&1

echo Waiting for TextGen WebUI to start...
set "wait_start=%time%"
timeout /t 5 /nobreak >nul
call :CalculateTime "!wait_start!"
echo Done waiting for TextGen WebUI ... (!elapsed_time! sec)
echo [%date% %time%] Wait completed in !elapsed_time! sec >> "%LOG_FILE%" 2>&1

call :CalculateTime "!start_time!"
echo ✓ TextGen WebUI started on http://127.0.0.1:5001 ... (!elapsed_time! sec)
echo [%date% %time%] Total TextGen startup: !elapsed_time! sec >> "%LOG_FILE%" 2>&1
echo.

endlocal
echo [%date% %time%] Ending start_textgen.bat >> "%LOG_FILE%" 2>&1
goto :eof

:CalculateTime
setlocal EnableDelayedExpansion
set "start=%~1"
set "end_time=%time%"
echo [%date% %time%] CalculateTime: start=%start%, end=%end_time% >> "%LOG_FILE%" 2>&1

set "start=%start: =0%"
set "end=%end_time: =0%"
for /f "tokens=1-4 delims=:. " %%a in ("!start!") do (
    set /a start_h=%%a
    set /a start_m=%%b
    set /a start_s=%%c
    set /a start_ms=%%d
)
for /f "tokens=1-4 delims=:. " %%a in ("!end!") do (
    set /a end_h=%%a
    set /a end_m=%%b
    set /a end_s=%%c
    set /a end_ms=%%d
)
set /a start_total=(start_h*3600 + start_m*60 + start_s)*100 + start_ms
set /a end_total=(end_h*3600 + end_m*60 + end_s)*100 + end_ms
set /a elapsed_total=end_total - start_total
if !elapsed_total! lss 0 set /a elapsed_total+=24*3600*100
set /a elapsed_time=elapsed_total / 100
set /a elapsed_time_dec=elapsed_total %% 100
set "elapsed_time=!elapsed_time!.!elapsed_time_dec!"
echo [%date% %time%] CalculateTime result: !elapsed_time! sec >> "%LOG_FILE%" 2>&1

endlocal & set "elapsed_time=%elapsed_time%"
goto :eof
