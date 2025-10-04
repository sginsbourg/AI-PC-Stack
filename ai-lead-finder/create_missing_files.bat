@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

cd /d "%~dp0" & cls & color 0A

echo.
echo 🛠️  Creating Missing Files and Directories
echo.

:: Create directories first
for %%D in (
    nutch_data
    nutch_data\urls
    nutch_data\conf
    results
    scripts
    models
    open-manus
    lead-analyzer
) do (
    if not exist "%%D\" (
        mkdir "%%D" 2>nul
        if exist "%%D\" (
            echo ✅ Created directory: %%D\
        ) else (
            echo ❌ Failed to create directory: %%D\
        )
    )
)

:: Create missing files with basic content
echo Creating missing files...

if not exist "docker-compose.yml" (
    (
        echo version: '3.8'
        echo.
        echo services:
        echo   nutch:
        echo     image: apache/nutch:latest
        echo   elasticsearch:
        echo     image: elasticsearch:8.11.0
        echo   ollama:
        echo     image: ollama/ollama:latest
        echo   open-manus:
        echo     build: ./open-manus
        echo   lead-analyzer:
        echo     build: ./lead-analyzer
    ) > docker-compose.yml
    echo ✅ Created: docker-compose.yml
)

if not exist "README.md" (
    echo # AI Lead Finder > README.md
    echo ✅ Created: README.md
)

if not exist "setup.bat" (
    echo @echo off > setup.bat
    echo echo Setup script >> setup.bat
    echo ✅ Created: setup.bat
)

if not exist "run.bat" (
    echo @echo off > run.bat
    echo echo Run script >> run.bat
    echo ✅ Created: run.bat
)

if not exist "check_services.bat" (
    echo @echo off > check_services.bat
    echo echo Check services script >> check_services.bat
    echo ✅ Created: check_services.bat
)

if not exist "stop_services.bat" (
    echo @echo off > stop_services.bat
    echo echo Stop services script >> stop_services.bat
    echo ✅ Created: stop_services.bat
)

if not exist "create_nutch_config.bat" (
    echo @echo off > create_nutch_config.bat
    echo echo Nutch config script >> create_nutch_config.bat
    echo ✅ Created: create_nutch_config.bat
)

if not exist "main_enhanced.py" (
    (
        echo "# Main AI Lead Finder Application"
        echo "print('AI Lead Finder')"
    ) > main_enhanced.py
    echo ✅ Created: main_enhanced.py
)

if not exist "scripts\crawl.bat" (
    if not exist "scripts\" mkdir scripts
    echo @echo off > scripts\crawl.bat
    echo echo Crawl script >> scripts\crawl.bat
    echo ✅ Created: scripts\crawl.bat
)

if not exist "scripts\init_models.bat" (
    if not exist "scripts\" mkdir scripts
    echo @echo off > scripts\init_models.bat
    echo echo Init models script >> scripts\init_models.bat
    echo ✅ Created: scripts\init_models.bat
)

if not exist "open-manus\Dockerfile" (
    if not exist "open-manus\" mkdir open-manus
    (
        echo FROM python:3.9-slim
        echo WORKDIR /app
        echo COPY . .
        echo CMD ["python", "app.py"]
    ) > open-manus\Dockerfile
    echo ✅ Created: open-manus\Dockerfile
)

if not exist "open-manus\requirements.txt" (
    if not exist "open-manus\" mkdir open-manus
    echo fastapi==0.104.1 > open-manus\requirements.txt
    echo ollama==0.1.7 >> open-manus\requirements.txt
    echo ✅ Created: open-manus\requirements.txt
)

if not exist "open-manus\app.py" (
    if not exist "open-manus\" mkdir open-manus
    (
        echo from fastapi import FastAPI
        echo app = FastAPI()
        echo.
        echo "@app.get('/')"
        echo def root():
        echo     return {"message": "Open Manus AI"}
    ) > open-manus\app.py
    echo ✅ Created: open-manus\app.py
)

if not exist "lead-analyzer\Dockerfile" (
    if not exist "lead-analyzer\" mkdir lead-analyzer
    (
        echo FROM python:3.9-slim
        echo WORKDIR /app
        echo COPY . .
        echo CMD ["python", "analyzer.py"]
    ) > lead-analyzer\Dockerfile
    echo ✅ Created: lead-analyzer\Dockerfile
)

if not exist "lead-analyzer\requirements.txt" (
    if not exist "lead-analyzer\" mkdir lead-analyzer
    echo elasticsearch==8.11.0 > lead-analyzer\requirements.txt
    echo pandas==2.0.3 >> lead-analyzer\requirements.txt
    echo ✅ Created: lead-analyzer\requirements.txt
)

if not exist "lead-analyzer\analyzer.py" (
    if not exist "lead-analyzer\" mkdir lead-analyzer
    (
        echo "# Lead Analyzer"
        echo "print('Lead analyzer')"
    ) > lead-analyzer\analyzer.py
    echo ✅ Created: lead-analyzer\analyzer.py
)

echo.
echo 🎉 Missing files creation completed!
echo 💡 Run 'verify_setup.bat' again to verify the setup.
echo.
pause