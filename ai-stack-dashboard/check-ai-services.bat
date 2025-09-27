@echo off
echo Checking AI Services Installation...
echo.

set "AI_STACK=C:\Users\sgins\AI_STACK"

echo Looking for AI tools in %AI_STACK%...
echo.

if exist "%AI_STACK%" (
    echo ✅ AI_STACK directory exists
    dir "%AI_STACK%" /B
) else (
    echo ❌ AI_STACK directory not found at %AI_STACK%
    echo Please check the path or install the AI tools first
)

echo.
echo Checking individual services...
echo.

if exist "%AI_STACK%\MeloTTS" (
    echo ✅ MeloTTS found
) else (
    echo ❌ MeloTTS not found
)

if exist "%AI_STACK%\OpenManus" (
    echo ✅ OpenManus found  
) else (
    echo ❌ OpenManus not found
)

if exist "%AI_STACK%\OpenSora" (
    echo ✅ OpenSora found
) else (
    echo ❌ OpenSora not found
)

if exist "%AI_STACK%\Orpheus-TTS" (
    echo ✅ Orpheus-TTS found
) else (
    echo ❌ Orpheus-TTS not found
)

if exist "%AI_STACK%\tg-webui" (
    echo ✅ Text Generation WebUI found
) else (
    echo ❌ Text Generation WebUI not found
)

if exist "%AI_STACK%\Ollama" (
    echo ✅ Ollama found
) else (
    echo ❌ Ollama not found
)

echo.
pause