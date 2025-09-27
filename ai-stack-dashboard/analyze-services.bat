@echo off
set "AI_STACK=C:\Users\sgins\AI_STACK"

echo 🔍 Analyzing AI Services...
echo.

echo Checking MeloTTS...
if exist "%AI_STACK%\MeloTTS\requirements.txt" (
    echo ✅ Has requirements.txt
) else (
    echo ❌ No requirements.txt found
)
if exist "%AI_STACK%\MeloTTS\app.py" (
    echo ✅ Has app.py
) else (
    echo ❌ No app.py found
)
echo.

echo Checking OpenManus...
if exist "%AI_STACK%\OpenManus\requirements.txt" (
    echo ✅ Has requirements.txt
) else (
    echo ❌ No requirements.txt found
)
if exist "%AI_STACK%\OpenManus\main.py" (
    echo ✅ Has main.py
) else (
    echo ❌ No main.py found
)
echo.

echo Checking OpenSora...
if exist "%AI_STACK%\OpenSora\requirements.txt" (
    echo ✅ Has requirements.txt
) else (
    echo ❌ No requirements.txt found
)
if exist "%AI_STACK%\OpenSora\opensora_web.py" (
    echo ✅ Has opensora_web.py
) else (
    echo ❌ No opensora_web.py found
)
echo.

echo Checking Orpheus-TTS...
if exist "%AI_STACK%\Orpheus-TTS\requirements.txt" (
    echo ✅ Has requirements.txt
) else (
    echo ❌ No requirements.txt found
)
if exist "%AI_STACK%\Orpheus-TTS\orpheus_web.py" (
    echo ✅ Has orpheus_web.py
) else (
    echo ❌ No orpheus_web.py found
)
echo.

echo Checking Text Generation WebUI...
if exist "%AI_STACK%\tg-webui\requirements.txt" (
    echo ✅ Has requirements.txt
) else (
    echo ❌ No requirements.txt found
)
if exist "%AI_STACK%\tg-webui\server.py" (
    echo ✅ Has server.py
) else (
    echo ❌ No server.py found
)
echo.

pause