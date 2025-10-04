@echo off
chcp 65001 >nul

echo Initializing AI models...

:: Wait for Ollama to be ready
:wait_for_ollama
docker exec ollama curl -s http://localhost:11434/api/tags > nul
if %errorlevel% neq 0 (
    echo Waiting for Ollama...
    timeout /t 5 /nobreak > nul
    goto wait_for_ollama
)

:: Pull required models
echo Pulling Qwen model...
docker exec ollama curl -X POST http://localhost:11434/api/pull -d "{\"name\": \"qwen:7b\"}"

echo Pulling DeepSeek model...
docker exec ollama curl -X POST http://localhost:11434/api/pull -d "{\"name\": \"deepseek-coder:6.7b\"}"

echo ✅ Models initialized successfully!