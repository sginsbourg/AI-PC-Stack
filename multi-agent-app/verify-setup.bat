@echo off
setlocal EnableDelayedExpansion

color 0A
title Multi-Agent Application Setup Verification
set PATH=%PATH%;C:\Users\sgins\Python312;C:\Users\sgins\Python312\Scripts;C:\ffmpeg\bin;C:\Program Files\Git\bin;C:\Windows\System32;C:\Users\sgins\miniconda3\Scripts; & python.exe -m pip install --upgrade pip
cd /d "%~dp0" & set PATH=%PATH%;C:\Windows\System32\WindowsPowerShell\v1.0
cls

:: Set variables
set "ROOT_DIR=C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\multi-agent-app"
set "AI_STACK_DIR=C:\Users\sgins\AI_STACK"
set "CONFIGS_DIR=%ROOT_DIR%\configs"
set "ERROR_COUNT=0"
set "CHECK_COUNT=0"

echo ==================================================
echo Multi-Agent Application Setup Verification Script
echo Date: %DATE% %TIME%
echo Root Directory: %ROOT_DIR%
echo ==================================================
echo.

:: Function to print check result
:print_result
set /a CHECK_COUNT+=1
if %1==0 (
    echo [OK] %2
) else (
    echo [ERROR] %2
    set /a ERROR_COUNT+=1
)
goto :eof

:: === 1. Check Software Prerequisites ===

echo Checking Software Prerequisites...
echo.

:: Check Node.js
echo Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "delims=" %%i in ('node --version') do set "NODE_VERSION=%%i"
    call :print_result 0 "Node.js installed (version: !NODE_VERSION!)"
) else (
    call :print_result 1 "Node.js not found. Install from https://nodejs.org/"
)

:: Check npm
echo Checking npm...
where npm >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "delims=" %%i in ('npm --version') do set "NPM_VERSION=%%i"
    call :print_result 0 "npm installed (version: !NPM_VERSION!)"
) else (
    call :print_result 1 "npm not found. Install with Node.js from https://nodejs.org/"
)

:: Check Docker
echo Checking Docker...
where docker >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "delims=" %%i in ('docker --version') do set "DOCKER_VERSION=%%i"
    call :print_result 0 "Docker installed (version: !DOCKER_VERSION!)"
) else (
    call :print_result 1 "Docker not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop/"
)

:: Check Docker Compose
echo Checking Docker Compose...
where docker-compose >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "delims=" %%i in ('docker-compose --version') do set "DC_VERSION=%%i"
    call :print_result 0 "Docker Compose installed (version: !DC_VERSION!)"
) else (
    call :print_result 1 "Docker Compose not found. Ensure Docker Desktop is installed."
)

:: Check Python
echo Checking Python...
where python >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "delims=" %%i in ('python --version') do set "PYTHON_VERSION=%%i"
    call :print_result 0 "Python installed (version: !PYTHON_VERSION!)"
) else (
    call :print_result 1 "Python not found. Install from https://www.python.org/downloads/"
)

:: Check Locust
echo Checking Locust...
pip show locust >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "tokens=2 delims=:" %%i in ('pip show locust ^| findstr /C:"Version"') do set "LOCUST_VERSION=%%i"
    call :print_result 0 "Locust installed (version:!LOCUST_VERSION!)"
) else (
    call :print_result 1 "Locust not found. Install with: pip install locust"
)

:: Check Java (JDK for JMeter)
echo Checking Java (JDK)...
where java >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "tokens=3" %%i in ('java -version 2^>^&1 ^| findstr /C:"version"') do set "JAVA_VERSION=%%i"
    call :print_result 0 "Java installed (version: !JAVA_VERSION!)"
) else (
    call :print_result 1 "Java not found. Install JDK 17+ from https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html"
)

:: Check JMeter
echo Checking JMeter...
where jmeter >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "delims=" %%i in ('jmeter --version ^| findstr /C:"JMeter"') do set "JMETER_VERSION=%%i"
    call :print_result 0 "JMeter installed (version: !JMETER_VERSION!)"
) else (
    call :print_result 1 "JMeter not found. Install from https://jmeter.apache.org/download_jmeter.cgi"
)

:: Check k6
echo Checking k6...
where k6 >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "delims=" %%i in ('k6 version') do set "K6_VERSION=%%i"
    call :print_result 0 "k6 installed (version: !K6_VERSION!)"
) else (
    call :print_result 1 "k6 not found. Install from https://k6.io/docs/getting-started/installation/"
)

:: Check tg-webui directory
echo Checking AI_STACK (tg-webui)...
if exist "%AI_STACK_DIR%\server.py" (
    call :print_result 0 "tg-webui found at %AI_STACK_DIR%"
) else (
    call :print_result 1 "tg-webui not found at %AI_STACK_DIR%. Ensure AI_STACK is set up with DeepSeek-V3.1 model."
)

:: Check if tg-webui is running
echo Checking tg-webui server...
netstat -an | find "5000" >nul
if %ERRORLEVEL%==0 (
    call :print_result 0 "tg-webui server running on port 5000"
) else (
    echo Attempting to start tg-webui...
    start /B "" cmd /c "cd "%AI_STACK_DIR%" && python server.py --model deepseek-ai_DeepSeek-V3.1 --api"
    timeout /t 5 >nul
    netstat -an | find "5000" >nul
    if %ERRORLEVEL%==0 (
        call :print_result 0 "tg-webui started successfully on port 5000"
    ) else (
        call :print_result 1 "tg-webui failed to start. Check %AI_STACK_DIR%\server.py and DeepSeek-V3.1 model."
    )
)

echo.
:: === 2. Check Source Files ===

echo Checking Source Files in %ROOT_DIR%...
echo.

:: List of expected files
set "FILES=dashboard\index.html orchestrator\orchestrator.js orchestrator\package.json orchestrator\Dockerfile generator\generator.js generator\package.json generator\Dockerfile runner\runner.js runner\package.json runner\Dockerfile analyzer\analyzer.js analyzer\package.json analyzer\Dockerfile configs\.env configs\docker-compose.yml configs\prometheus.yml scripts\test-script.js scripts\locustfile.py scripts\test-plan.jmx results\k6\k6-results.json results\locust\locust-results.csv results\jmeter\jmeter-results.jtl README.md"

:: Check each file
for %%f in (%FILES%) do (
    if exist "%ROOT_DIR%\%%f" (
        call :print_result 0 "File exists: %%f"
    ) else (
        call :print_result 1 "File missing: %%f"
    )
)

:: Check directory structure
set "DIRS=dashboard orchestrator generator runner analyzer configs scripts results results\k6 results\locust results\jmeter"
echo.
echo Checking Directory Structure...
for %%d in (%DIRS%) do (
    if exist "%ROOT_DIR%\%%d" (
        call :print_result 0 "Directory exists: %%d"
    ) else (
        call :print_result 1 "Directory missing: %%d"
    )
)

echo.
:: === 3. Check Environment Variables ===

echo Checking Environment Configuration...
echo.

:: Check .env file content
if exist "%CONFIGS_DIR%\.env" (
    findstr /C:"LOCAL_LLM_URL" "%CONFIGS_DIR%\.env" >nul
    if %ERRORLEVEL%==0 (
        call :print_result 0 ".env file contains LOCAL_LLM_URL"
    ) else (
        call :print_result 1 ".env file missing LOCAL_LLM_URL. Add: LOCAL_LLM_URL=http://localhost:5000/v1"
    )
    findstr /C:"PORT" "%CONFIGS_DIR%\.env" >nul
    if %ERRORLEVEL%==0 (
        call :print_result 0 ".env file contains PORT"
    ) else (
        call :print_result 1 ".env file missing PORT. Add: PORT=3000"
    )
) else (
    call :print_result 1 ".env file not found in %CONFIGS_DIR%"
)

:: Check Node.js dependencies
echo Checking Node.js dependencies...
for %%d in (orchestrator generator runner analyzer) do (
    if exist "%ROOT_DIR%\%%d\node_modules" (
        call :print_result 0 "Dependencies installed for %%d"
    ) else (
        call :print_result 1 "Dependencies missing for %%d. Run: cd "%ROOT_DIR%\%%d" && npm install"
    )
)

echo.
:: === 4. Summary ===

echo ==================================================
echo Verification Summary
echo Total Checks: %CHECK_COUNT%
echo Errors Found: %ERROR_COUNT%
echo ==================================================
echo.

if %ERROR_COUNT%==0 (
    echo All prerequisites and files verified successfully!
    echo You can now run the application using launch-dashboard.bat.
) else (
    echo %ERROR_COUNT% errors found. Please address the issues listed above.
    echo Refer to README.md for detailed setup instructions.
    echo To recreate missing files, consult the setup guide or regenerate with Grok.
)

echo.
echo Next Steps:
echo 1. Fix any errors reported above.
echo 2. Run: cd "%ROOT_DIR%" && launch-dashboard.bat
echo 3. Access dashboard at: file:///%ROOT_DIR%/dashboard/index.html
echo 4. View metrics at: http://localhost:3001 (Grafana)
echo 5. Stop services: cd "%CONFIGS_DIR%" && docker-compose down

pause
endlocal
color 0A
title Multi-Agent Application Setup Verification
set PATH=%PATH%;C:\Users\sgins\Python312;C:\Users\sgins\Python312\Scripts;C:\ffmpeg\bin;C:\Program Files\Git\bin;C:\Windows\System32;C:\Users\sgins\miniconda3\Scripts; & python.exe -m pip install --upgrade pip
cd /d "%~dp0" & set PATH=%PATH%;C:\Windows\System32\WindowsPowerShell\v1.0
cls


