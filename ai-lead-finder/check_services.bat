@echo off
chcp 65001 >nul

echo.
echo 🔍 Checking AI Lead Finder Services...
echo.

set services_ok=1

:: Check Docker
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    set services_ok=0
) else (
    echo ✅ Docker is running
)

:: Check individual services
echo.
echo Checking containers...
for %%s in ("nutch-crawler" "elasticsearch" "kibana" "ollama" "open-manus" "lead-analyzer") do (
    docker ps | findstr "%%~s" >nul
    if !errorlevel! equ 0 (
        echo ✅ %%~s is running
    ) else (
        echo ❌ %%~s is not running
        set services_ok=0
    )
)

echo.
if %services_ok% equ 0 (
    echo ❌ Some services are not running
    echo 💡 Run 'setup.bat' to start all services
) else (
    echo ✅ All services are running correctly
)

echo.
echo 📊 Service URLs:
echo    Kibana: http://localhost:5601
echo    Open Manus: http://localhost:8000
echo    Ollama: http://localhost:11434
echo.
pause