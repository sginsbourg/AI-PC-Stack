@echo off
setlocal EnableDelayedExpansion

color 0A
title Multi-Agent Application Installation Verification
set PATH=%PATH%;C:\Users\sgins\Python312;C:\Users\sgins\Python312\Scripts;C:\ffmpeg\bin;C:\Program Files\Git\bin;C:\Windows\System32;C:\Users\sgins\miniconda3\Scripts; & python.exe -m pip install --upgrade pip
cd /d "%~dp0" & set PATH=%PATH%;C:\Windows\System32\WindowsPowerShell\v1.0
cls

goto :main

:main
:: Set variables
set "ROOT_DIR=C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\multi-agent"
set "AI_STACK_DIR=C:\Users\sgins\AI_STACK"
set "CONFIGS_DIR=%ROOT_DIR%\configs"
set "ERROR_COUNT=0"
set "CHECK_COUNT=0"

echo DEBUG: Initializing script...
echo ==================================================
echo Multi-Agent Application Installation Verification Script
echo Date: %DATE% %TIME%
echo Root Directory: %ROOT_DIR%
echo AI Stack Directory: %AI_STACK_DIR%
echo ==================================================
echo.

echo DEBUG: Starting software installation checks...
echo.

:: === 1. Check Software Installations ===

echo Checking Software Installations...
echo.

:: Check Node.js
echo DEBUG: Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL%==0 (
    set "NODE_VERSION="
    for /f "delims=" %%i in ('node --version 2^>nul') do set "NODE_VERSION=%%i"
    if defined NODE_VERSION (
        call :print_result 0 "Node.js installed (version: !NODE_VERSION!)"
    ) else (
        call :print_result 1 "Node.js version check failed. Ensure node is in PATH."
    )
) else (
    call :print_result 1 "Node.js not found. Install from https://nodejs.org/"
)

:: Check npm
echo DEBUG: Checking npm...
where npm >nul 2>&1
if %ERRORLEVEL%==0 (
    set "NPM_VERSION="
    for /f "delims=" %%i in ('npm --version 2^>nul') do set "NPM_VERSION=%%i"
    if defined NPM_VERSION (
        call :print_result 0 "npm installed (version: !NPM_VERSION!)"
    ) else (
        call :print_result 1 "npm version check failed. Ensure npm is in PATH."
    )
) else (
    call :print_result 1 "npm not found. Install with Node.js from https://nodejs.org/"
)

:: Check Docker
echo DEBUG: Checking Docker...
where docker >nul 2>&1
if %ERRORLEVEL%==0 (
    set "DOCKER_VERSION="
    for /f "delims=" %%i in ('docker --version 2^>nul') do set "DOCKER_VERSION=%%i"
    if defined DOCKER_VERSION (
        call :print_result 0 "Docker installed (version: !DOCKER_VERSION!)"
        echo DEBUG: Checking if Docker is running...
        docker info >nul 2>&1
        if %ERRORLEVEL%==0 (
            call :print_result 0 "Docker is running"
        ) else (
            call :print_result 1 "Docker is not running. Start Docker Desktop."
        )
    ) else (
        call :print_result 1 "Docker version check failed. Ensure docker is in PATH."
    )
) else (
    call :print_result 1 "Docker not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop/"
)

:: Check Docker Compose
echo DEBUG: Checking Docker Compose...
where docker-compose >nul 2>&1
if %ERRORLEVEL%==0 (
    set "DC_VERSION="
    for /f "delims=" %%i in ('docker-compose --version 2^>nul') do set "DC_VERSION=%%i"
    if defined DC_VERSION (
        call :print_result 0 "Docker Compose installed (version: !DC_VERSION!)"
    ) else (
        call :print_result 1 "Docker Compose version check failed. Ensure docker-compose is in PATH."
    )
) else (
    call :print_result 1 "Docker Compose not found. Ensure Docker Desktop is installed."
)

:: Check Python
echo DEBUG: Checking Python...
where python >nul 2>&1
if %ERRORLEVEL%==0 (
    set "PYTHON_VERSION="
    for /f "delims=" %%i in ('python --version 2^>nul') do set "PYTHON_VERSION=%%i"
    if defined PYTHON_VERSION (
        call :print_result 0 "Python installed (version: !PYTHON_VERSION!)"
    ) else (
        call :print_result 1 "Python version check failed. Ensure python is in PATH."
    )
) else (
    call :print_result 1 "Python not found. Install from https://www.python.org/downloads/"
)

:: Check Locust
echo DEBUG: Checking Locust...
pip show locust >nul 2>&1
if %ERRORLEVEL%==0 (
    set "LOCUST_VERSION="
    for /f "tokens=2 delims=:" %%i in ('pip show locust ^| findstr /C:"Version" 2^>nul') do set "LOCUST_VERSION=%%i"
    if defined LOCUST_VERSION (
        call :print_result 0 "Locust installed (version:!LOCUST_VERSION!)"
    ) else (
        call :print_result 1 "Locust version check failed. Ensure pip and locust are installed."
    )
) else (
    call :print_result 1 "Locust not found. Install with: pip install locust"
)

:: Check markdown
echo DEBUG: Checking Python markdown package...
pip show markdown >nul 2>&1
if %ERRORLEVEL%==0 (
    set "MARKDOWN_VERSION="
    for /f "tokens=2 delims=:" %%i in ('pip show markdown ^| findstr /C:"Version" 2^>nul') do set "MARKDOWN_VERSION=%%i"
    if defined MARKDOWN_VERSION (
        call :print_result 0 "Python markdown package installed (version:!MARKDOWN_VERSION!)"
    ) else (
        call :print_result 1 "Python markdown package version check failed. Ensure pip and markdown are installed."
    )
) else (
    call :print_result 1 "Python markdown package not found. Install with: pip install markdown"
)

:: Check gradio
echo DEBUG: Checking Python gradio package...
pip show gradio >nul 2>&1
if %ERRORLEVEL%==0 (
    set "GRADIO_VERSION="
    for /f "tokens=2 delims=:" %%i in ('pip show gradio ^| findstr /C:"Version" 2^>nul') do set "GRADIO_VERSION=%%i"
    if defined GRADIO_VERSION (
        call :print_result 0 "Python gradio package installed (version:!GRADIO_VERSION!)"
        :: Check for gradio version < 5.0.0
        for /f "tokens=1 delims=." %%i in ("!GRADIO_VERSION!") do set "GRADIO_MAJOR=%%i"
        if !GRADIO_MAJOR! GEQ 5 (
            call :print_result 1 "Gradio version !GRADIO_VERSION! may be incompatible. Try: pip install gradio==4.0.0"
        )
    ) else (
        call :print_result 1 "Python gradio package version check failed. Ensure pip and gradio are installed."
    )
) else (
    call :print_result 1 "Python gradio package not found. Install with: pip install gradio==4.0.0"
)

:: Check Java (JDK for JMeter)
echo DEBUG: Checking Java (JDK)...
where java >nul 2>&1
if %ERRORLEVEL%==0 (
    set "JAVA_VERSION="
    for /f "tokens=3" %%i in ('java -version 2^>^&1 ^| findstr /C:"version" 2^>nul') do set "JAVA_VERSION=%%i"
    if defined JAVA_VERSION (
        call :print_result 0 "Java installed (version: !JAVA_VERSION!)"
    ) else (
        call :print_result 1 "Java version check failed. Ensure java is in PATH."
    )
) else (
    call :print_result 1 "Java not found. Install JDK 17+ from https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html"
)

:: Check JMeter
echo DEBUG: Checking JMeter...
where jmeter >nul 2>&1
if %ERRORLEVEL%==0 (
    set "JMETER_VERSION="
    for /f "delims=" %%i in ('jmeter --version ^| findstr /C:"JMeter" 2^>nul') do set "JMETER_VERSION=%%i"
    if defined JMETER_VERSION (
        call :print_result 0 "JMeter installed (version: !JMETER_VERSION!)"
    ) else (
        call :print_result 1 "JMeter version check failed. Ensure jmeter is in PATH."
    )
) else (
    call :print_result 1 "JMeter not found. Install from https://jmeter.apache.org/download_jmeter.cgi"
)

:: Check k6
echo DEBUG: Checking k6...
where k6 >nul 2>&1
if %ERRORLEVEL%==0 (
    set "K6_VERSION="
    for /f "delims=" %%i in ('k6 version 2^>nul') do set "K6_VERSION=%%i"
    if defined K6_VERSION (
        call :print_result 0 "k6 installed (version: !K6_VERSION!)"
    ) else (
        call :print_result 1 "k6 version check failed. Ensure k6 is in PATH."
    )
) else (
    call :print_result 1 "k6 not found. Install from https://k6.io/docs/getting-started/installation/"
)

:: Check tg-webui directory
echo DEBUG: Checking AI_STACK (tg-webui)...
if exist "%AI_STACK_DIR%\server.py" (
    call :print_result 0 "tg-webui found at %AI_STACK_DIR%"
) else (
    call :print_result 1 "tg-webui not found at %AI_STACK_DIR%. Ensure AI_STACK is set up with DeepSeek-V3.1 model."
)

:: Check if tg-webui is running
echo DEBUG: Checking tg-webui server...
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
echo DEBUG: Starting source file checks...
echo.

:: === 2. Check Source Files ===

echo Checking Source Files in %ROOT_DIR%...
echo.

:: List of expected files
set "FILES=dashboard\index.html orchestrator\orchestrator.js orchestrator\package.json orchestrator\Dockerfile generator\generator.js generator\package.json generator\Dockerfile runner\runner.js runner\package.json runner\Dockerfile analyzer\analyzer.js analyzer\package.json analyzer\Dockerfile configs\.env configs\docker-compose.yml configs\prometheus.yml scripts\test-script.js scripts\locustfile.py scripts\test-plan.jmx results\k6\k6-results.json results\locust\locust-results.csv results\jmeter\jmeter-results.jtl README.md"

:: Check each file
for %%f in (%FILES%) do (
    echo DEBUG: Checking file %%f...
    if exist "%ROOT_DIR%\%%f" (
        call :print_result 0 "File exists: %%f"
    ) else (
        call :print_result 1 "File missing: %%f"
    )
)

:: Check docker-compose.yml content
echo DEBUG: Checking docker-compose.yml content...
if exist "%CONFIGS_DIR%\docker-compose.yml" (
    for /f %%i in ("%CONFIGS_DIR%\docker-compose.yml") do set "FILESIZE=%%~zi"
    if !FILESIZE! GTR 0 (
        call :print_result 0 "docker-compose.yml exists and is non-empty"
        :: Validate docker-compose.yml syntax and capture error message
        set "COMPOSE_ERROR="
        for /f "delims=" %%i in ('docker-compose -f "%CONFIGS_DIR%\docker-compose.yml" config 2^>^&1') do set "COMPOSE_ERROR=%%i"
        docker-compose -f "%CONFIGS_DIR%\docker-compose.yml" config >nul 2>&1
        if %ERRORLEVEL%==0 (
            call :print_result 0 "docker-compose.yml syntax is valid"
        ) else (
            call :print_result 1 "docker-compose.yml has invalid syntax: !COMPOSE_ERROR!. Check YAML format and ensure no tabs or invalid characters."
        )
    ) else (
        call :print_result 1 "docker-compose.yml is empty. Populate with service definitions from setup guide."
    )
) else (
    call :print_result 1 "docker-compose.yml not found in %CONFIGS_DIR%"
)

:: Check for conflicting docker-compose.yaml
echo DEBUG: Checking for conflicting docker-compose.yaml...
if exist "%CONFIGS_DIR%\docker-compose.yaml" (
    call :print_result 1 "Conflicting docker-compose.yaml found. Rename or remove: %CONFIGS_DIR%\docker-compose.yaml"
) else (
    call :print_result 0 "No conflicting docker-compose.yaml found"
)

echo.
echo DEBUG: Starting directory structure checks...
echo.

:: === 3. Check Directory Structure ===

echo Checking Directory Structure...
echo.

:: Check directory structure
set "DIRS=dashboard orchestrator generator runner analyzer configs scripts results results\k6 results\locust results\jmeter"
for %%d in (%DIRS%) do (
    echo DEBUG: Checking directory %%d...
    if exist "%ROOT_DIR%\%%d" (
        call :print_result 0 "Directory exists: %%d"
    ) else (
        call :print_result 1 "Directory missing: %%d"
    )
)

echo.
echo DEBUG: Starting environment configuration checks...
echo.

:: === 4. Check Environment Variables ===

echo Checking Environment Configuration...
echo.

:: Check .env file content
if exist "%CONFIGS_DIR%\.env" (
    echo DEBUG: Checking .env for LOCAL_LLM_URL...
    findstr /C:"LOCAL_LLM_URL" "%CONFIGS_DIR%\.env" >nul
    if %ERRORLEVEL%==0 (
        call :print_result 0 ".env file contains LOCAL_LLM_URL"
    ) else (
        call :print_result 1 ".env file missing LOCAL_LLM_URL. Add: LOCAL_LLM_URL=http://localhost:5000/v1"
    )
    echo DEBUG: Checking .env for PORT...
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
echo DEBUG: Checking Node.js dependencies...
for %%d in (orchestrator generator runner analyzer) do (
    echo DEBUG: Checking dependencies for %%d...
    if exist "%ROOT_DIR%\%%d\node_modules" (
        call :print_result 0 "Dependencies installed for %%d"
    ) else (
        call :print_result 1 "Dependencies missing for %%d. Run: cd "%ROOT_DIR%\%%d" && npm install"
    )
)

echo.
echo DEBUG: Generating summary...
echo.

:: === 5. Summary ===

echo ==================================================
echo Verification Summary
echo Total Checks: %CHECK_COUNT%
echo Errors Found: %ERROR_COUNT%
echo ==================================================
echo.

if %ERROR_COUNT%==0 (
    echo All installations and files verified successfully!
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
goto :eof

:: Function to print check result
:print_result
echo DEBUG: print_result called with status=%1 message=%2
if "%1"=="" (
    echo [ERROR] Invalid call to print_result: No status provided
    set /a ERROR_COUNT+=1
    set /a CHECK_COUNT+=1
    goto :eof
)
if "%1"=="0" (
    echo [OK] %2
) else (
    echo [ERROR] %2
    set /a ERROR_COUNT+=1
)
set /a CHECK_COUNT+=1
goto :eof