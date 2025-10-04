@echo off
chcp 65001 >nul

cd /d "%~dp0" & cls & color 0A

echo.
echo 🔍 AI Lead Finder - Service Status
echo.

echo Checking containers...
docker ps

echo.
echo 📊 Service URLs:
echo Kibana: http://localhost:5601
echo Open Manus: http://localhost:8000
echo Ollama: http://localhost:11434
echo Elasticsearch: http://localhost:9200
echo.
pause