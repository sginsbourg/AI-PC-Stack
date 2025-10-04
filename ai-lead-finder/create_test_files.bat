@echo off
chcp 65001 >nul

cd /d "%~dp0" & cls & color 0A

echo Creating test file structure for verification...

:: Create directories
mkdir nutch_data 2>nul
mkdir nutch_data\urls 2>nul
mkdir nutch_data\conf 2>nul
mkdir results 2>nul
mkdir scripts 2>nul
mkdir models 2>nul
mkdir open-manus 2>nul
mkdir lead-analyzer 2>nul

:: Create minimal valid files with content

:: docker-compose.yml
(
echo version: '3.8'
echo.
echo services:
echo   test:
echo     image: hello-world
) > docker-compose.yml

:: README.md
echo # AI Lead Finder > README.md

:: Batch files
echo @echo off > setup.bat
echo echo Setup script >> setup.bat

echo @echo off > run.bat
echo echo Run script >> run.bat

echo @echo off > check_services.bat
echo echo Check services script >> check_services.bat

echo @echo off > stop_services.bat
echo echo Stop services script >> stop_services.bat

echo @echo off > create_nutch_config.bat
echo echo Nutch config script >> create_nutch_config.bat

echo @echo off > verify_setup.bat
echo echo Verification script >> verify_setup.bat

:: Python files
(
echo "# Main application"
echo "print('AI Lead Finder')"
) > main_enhanced.py

:: Script files
echo @echo off > scripts\crawl.bat
echo echo Crawl script >> scripts\crawl.bat

echo @echo off > scripts\init_models.bat
echo echo Init models script >> scripts\init_models.bat

:: Open Manus files
(
echo "FROM python:3.9-slim"
echo "WORKDIR /app"
echo "COPY . ."
echo "CMD python app.py"
) > open-manus\Dockerfile

echo fastapi^>^=0.104.1 > open-manus\requirements.txt

(
echo "from fastapi import FastAPI"
echo "app = FastAPI()"
echo "@app.get('/')"
echo "def root(): return {'message': 'Open Manus'}"
) > open-manus\app.py

:: Lead Analyzer files
(
echo "FROM python:3.9-slim"
echo "WORKDIR /app"
echo "COPY . ."
echo "CMD python analyzer.py"
) > lead-analyzer\Dockerfile

echo elasticsearch^>^=8.11.0 > lead-analyzer\requirements.txt

(
echo "# Lead Analyzer"
echo "print('Analyzing leads...')"
) > lead-analyzer\analyzer.py

echo.
echo ✅ Test file structure created!
echo 🧪 Now run 'verify_setup.bat' to test the verification.
echo.
pause