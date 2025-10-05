@echo off
cls
title ai-dashboard
color 0A
cd /d "%~dp0"

:: Set Python and other paths
set PATH=C:\Users\sgins\Python312;C:\Users\sgins\Python312\Scripts;C:\ffmpeg\bin;C:\Program Files\Git\bin;C:\Windows\System32;C:\Users\sgins\miniconda3\Scripts;%PATH%

:: Update pip and install dependencies
python.exe -m pip install --upgrade pip
pip install torchaudio streamlit

:: Add Java and other paths
set PATH=C:\Program Files\Java\jdk-24\bin;C:\Windows\System32\WindowsPowerShell\v1.0;%PATH%

:: Run the dashboard
node "ai-dashboard.js"
pause
exit