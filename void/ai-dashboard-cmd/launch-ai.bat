@echo off
cls
title ai-dashboard
color 0A
cd /d "%~dp0"
set PATH=%PATH%;C:\Users\sgins\Python312;C:\Users\sgins\Python312\Scripts;C:\ffmpeg\bin;C:\Program Files\Git\bin;C:\Windows\System32;C:\Users\sgins\miniconda3\Scripts;
python.exe -m pip install --upgrade pip
pip install torchaudio
pip install streamlit
set PATH=%PATH%;C:\Windows\System32\WindowsPowerShell\v1.0
set PATH=%PATH%;C:\Program Files\Java\jdk-24\bin
set PATH=%PATH%;C:\Windows\System32;”C:\Program Files\Docker\Docker”; 
node "%~dp0ai-dashboard.js"
pause
exit