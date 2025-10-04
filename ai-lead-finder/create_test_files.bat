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

echo.
echo Creating missing files...
echo.

:: Root directory files
if not exist "docker-compose.yml" (
    (
        echo version: '3.8'
        echo.
        echo services:
        echo   nutch:
        echo     image: apache/nutch:latest
        echo     container_name: nutch-crawler
        echo     volumes:
        echo       - ./nutch_data:/root/nutch/runtime/local
        echo       - ./scripts:/scripts
        echo.
        echo   elasticsearch:
        echo     image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        echo     container_name: elasticsearch
        echo     environment:
        echo       - discovery.type=single-node
        echo       - xpack.security.enabled=false
        echo.
        echo   ollama:
        echo     image: ollama/ollama:latest
        echo     container_name: ollama
        echo     ports:
        echo       - "11434:11434"
        echo.
        echo   open-manus:
        echo     build: ./open-manus
        echo     container_name: open-manus
        echo     ports:
        echo       - "8000:8000"
        echo.
        echo   lead-analyzer:
        echo     build: ./lead-analyzer
        echo     container_name: lead-analyzer
    ) > docker-compose.yml
    echo ✅ Created: docker-compose.yml
)

if not exist "README.md" (
    echo # AI-Powered Lead Finder > README.md
    echo. >> README.md
    echo Complete local AI system for finding leads for AI-powered software performance and load testing services. >> README.md
    echo ✅ Created: README.md
)

if not exist "setup.bat" (
    echo @echo off > setup.bat
    echo echo Setup script - run this first >> setup.bat
    echo ✅ Created: setup.bat
)

if not exist "run.bat" (
    echo @echo off > run.bat
    echo echo Run script - use this after setup >> run.bat
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
    echo echo Creating Nutch configuration... >> create_nutch_config.bat
    echo ✅ Created: create_nutch_config.bat
)

if not exist "main_enhanced.py" (
    (
        echo "#!/usr/bin/env python3"
        echo.
        echo "# Main AI Lead Finder Application"
        echo "print('AI Lead Finder - Main Application')"
    ) > main_enhanced.py
    echo ✅ Created: main_enhanced.py
)

:: Scripts directory
if not exist "scripts\crawl.bat" (
    if not exist "scripts\" mkdir scripts
    echo @echo off > scripts\crawl.bat
    echo echo Nutch crawl script >> scripts\crawl.bat
    echo ✅ Created: scripts\crawl.bat
)

if not exist "scripts\init_models.bat" (
    if not exist "scripts\" mkdir scripts
    echo @echo off > scripts\init_models.bat
    echo echo AI model initialization script >> scripts\init_models.bat
    echo ✅ Created: scripts\init_models.bat
)

:: Open Manus directory
if not exist "open-manus\Dockerfile" (
    if not exist "open-manus\" mkdir open-manus
    (
        echo FROM python:3.9-slim
        echo WORKDIR /app
        echo COPY requirements.txt .
        echo RUN pip install -r requirements.txt
        echo COPY . .
        echo CMD ["python", "app.py"]
    ) > open-manus\Dockerfile
    echo ✅ Created: open-manus\Dockerfile
)

if not exist "open-manus\requirements.txt" (
    if not exist "open-manus\" mkdir open-manus
    echo fastapi==0.104.1 > open-manus\requirements.txt
    echo uvicorn==0.24.0 >> open-manus\requirements.txt
    echo ollama==0.1.7 >> open-manus\requirements.txt
    echo elasticsearch==8.11.0 >> open-manus\requirements.txt
    echo ✅ Created: open-manus\requirements.txt
)

if not exist "open-manus\app.py" (
    if not exist "open-manus\" mkdir open-manus
    (
        echo from fastapi import FastAPI
        echo.
        echo app = FastAPI()
        echo.
        echo "@app.get('/')"
        echo def root():
        echo     return {"message": "Open Manus AI Lead Analyzer"}
        echo.
        echo "if __name__ == '__main__':"
        echo "    import uvicorn"
        echo "    uvicorn.run(app, host='0.0.0.0', port=8000)"
    ) > open-manus\app.py
    echo ✅ Created: open-manus\app.py
)

:: Lead Analyzer directory
if not exist "lead-analyzer\Dockerfile" (
    if not exist "lead-analyzer\" mkdir lead-analyzer
    (
        echo FROM python:3.9-slim
        echo WORKDIR /app
        echo COPY requirements.txt .
        echo RUN pip install -r requirements.txt
        echo COPY . .
        echo CMD ["python", "analyzer.py"]
    ) > lead-analyzer\Dockerfile
    echo ✅ Created: lead-analyzer\Dockerfile
)

if not exist "lead-analyzer\requirements.txt" (
    if not exist "lead-analyzer\" mkdir lead-analyzer
    echo elasticsearch==8.11.0 > lead-analyzer\requirements.txt
    echo pandas==2.0.3 >> lead-analyzer\requirements.txt
    echo requests==2.31.0 >> lead-analyzer\requirements.txt
    echo aiohttp==3.8.6 >> lead-analyzer\requirements.txt
    echo ✅ Created: lead-analyzer\requirements.txt
)

if not exist "lead-analyzer\analyzer.py" (
    if not exist "lead-analyzer\" mkdir lead-analyzer
    (
        echo "# Lead Analyzer Application"
        echo "import asyncio"
        echo.
        echo "async def main():"
        echo "    print('Lead analyzer starting...')"
        echo.
        echo "if __name__ == '__main__':"
        echo "    asyncio.run(main())"
    ) > lead-analyzer\analyzer.py
    echo ✅ Created: lead-analyzer\analyzer.py
)

echo.
echo 🎉 Missing files creation completed!
echo 💡 Run 'verify_setup_fixed.bat' again to verify the setup.
echo.
pause