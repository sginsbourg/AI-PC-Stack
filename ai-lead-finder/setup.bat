@echo off
chcp 65001 >nul

cd /d "%~dp0" & cls & color 0A

echo.
echo ========================================
echo   AI-Powered Lead Finder Setup
echo ========================================
echo.

echo Step 1: Creating directories...
mkdir results 2>nul
mkdir models 2>nul
mkdir nutch_data\urls 2>nul
mkdir nutch_data\conf 2>nul

echo Step 2: Creating seed file...
(
echo https://www.g2.com/categories/load-testing
echo https://www.capterra.com/load-testing-software/
echo https://www.trustradius.com/load-testing
echo https://stackoverflow.com/questions/tagged/performance-testing
echo https://www.reddit.com/r/softwaretesting/
echo https://aws.amazon.com/blogs/devops/tag/performance-testing/
echo https://azure.microsoft.com/en-us/blog/tag/performance/
echo https://github.com/topics/load-testing
echo https://k6.io/blog/
echo https://www.gatling.io/blog/
) > nutch_data\urls\seed.txt

echo Step 3: Starting Docker services...
docker-compose up -d --build

if not %errorlevel% == 0 (
    echo ERROR: Docker compose failed. Please check if Docker is running.
    pause
    exit /b 1
)

echo.
echo ✅ Setup completed! Services are starting...
echo.
echo 📊 Access Points:
echo    - Kibana Dashboard: http://localhost:5601
echo    - Open Manus API: http://localhost:8000
echo    - Ollama: http://localhost:11434
echo.
echo ⏰ AI models will download in the background
echo 💡 Wait 5-10 minutes then run 'run_fixed.bat'
echo.
pause