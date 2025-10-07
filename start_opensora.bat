@echo off
color 0A
title OpenSora
echo Starting Open-Sora Web UI...

:: Activate conda env (adjust path if needed, check with `conda info --base`)
call C:\Users\sgins\miniconda3\Scripts\activate.bat opensora
if errorlevel 1 (
    echo ERROR: Failed to activate conda environment 'opensora'.
    pause
    exit /b 1
)

:: Navigate to Open-Sora directory
cd /d "C:\Users\sgins\AI_STACK\OpenSora"
if errorlevel 1 (
    echo ERROR: Could not change to Open-Sora directory.
    pause
    exit /b 1
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
echo Starting Open-Sora Streamlit UI on http://localhost:8502
streamlit run opensora_web.py --server.port 8502
if errorlevel 1 (
    echo ERROR: Failed to start Streamlit.
    pause
    exit /b 1
)

pause