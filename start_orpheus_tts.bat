@echo off
echo Starting Orpheus-TTS Web UI...

:: Activate conda env (adjust conda path if needed, check with `conda info --base`)
call C:\Users\sgins\miniconda3\Scripts\activate.bat orpheus-tts
if errorlevel 1 (
    echo ERROR: Failed to activate conda environment 'orpheus-tts'.
    pause
    exit /b 1
)

:: Navigate to Orpheus-TTS directory
cd /d "C:\Users\sgins\AI_STACK\Orpheus-TTS"
if errorlevel 1 (
    echo ERROR: Could not change to Orpheus-TTS directory.
    pause
    exit /b 1
)

:: Install orpheus-speech if not present
pip show orpheus-speech >nul 2>&1
if errorlevel 1 (
    echo Installing orpheus-speech...
    pip install orpheus-speech
    if errorlevel 1 (
        echo ERROR: Failed to install orpheus-speech.
        pause
        exit /b 1
    )
    pip install vllm==0.7.3  # Fix for vLLM bugs
    if errorlevel 1 (
        echo ERROR: Failed to install vLLM fix.
        pause
        exit /b 1
    )
)

:: Install Streamlit if not present
pip show streamlit >nul 2>&1
if errorlevel 1 (
    echo Installing Streamlit...
    pip install streamlit
    if errorlevel 1 (
        echo ERROR: Failed to install Streamlit.
        pause
        exit /b 1
    )
)

:: Run Streamlit app
echo Starting Orpheus-TTS Streamlit UI on http://localhost:8503
streamlit run orpheus_web.py --server.port 8503
if errorlevel 1 (
    echo ERROR: Failed to start Streamlit.
    pause
    exit /b 1
)

pause