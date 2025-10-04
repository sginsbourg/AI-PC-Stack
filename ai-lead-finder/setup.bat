@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   AI-Powered Lead Finder Setup
echo ========================================
echo.
echo ✅ Confirmed: All services will run locally
echo ✅ No API keys required!
echo.

:: Create necessary directories
echo 📁 Creating directories...
if not exist "nutch_data\urls" mkdir nutch_data\urls
if not exist "nutch_data\conf" mkdir nutch_data\conf
if not exist "results" mkdir results
if not exist "scripts" mkdir scripts
if not exist "models" mkdir models
if not exist "open-manus" mkdir open-manus
if not exist "lead-analyzer" mkdir lead-analyzer

:: Create Nutch configuration
echo 📝 Creating Nutch configuration...
call create_nutch_config.bat

:: Build and start services
echo 🐳 Building and starting Docker containers...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo ❌ Docker compose failed. Please check if Docker is running.
    pause
    exit /b 1
)

:: Wait for services to be ready
echo ⏳ Waiting for services to initialize...
timeout /t 60 /nobreak >nul

:: Initialize AI models
echo 🤖 Initializing AI models...
echo    This may take 10-30 minutes depending on your internet speed...
echo    Models will be downloaded: Qwen 7B (~4GB) and DeepSeek Coder 6.7B (~3.7GB)
echo.

docker exec ollama curl -X POST http://localhost:11434/api/pull -d "{\"name\": \"qwen:7b\"}"

if %errorlevel% neq 0 (
    echo ❌ Failed to pull Qwen model
    pause
    exit /b 1
)

docker exec ollama curl -X POST http://localhost:11434/api/pull -d "{\"name\": \"deepseek-coder:6.7b\"}"

if %errorlevel% neq 0 (
    echo ❌ Failed to pull DeepSeek model
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 Setup completed successfully!
echo ========================================
echo.
echo 📊 Access Points:
echo    - Kibana Dashboard: http://localhost:5601
echo    - Open Manus API: http://localhost:8000
echo    - Ollama: http://localhost:11434
echo.
echo 🚀 Run the system: python main_enhanced.py
echo.
echo 💡 Remember: All AI models are running locally
echo 💡 No internet required after setup!
echo.
pause