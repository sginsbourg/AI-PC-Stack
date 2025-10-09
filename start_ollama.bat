@echo off
cls
color 0A
REM openmanus_web.py - ERROR ???
title Ollama
cd /d "C:\Users\sgins\AppData\Local\Programs\Ollama"
set OLLAMA_HOST=127.0.0.1:11435
if not exist ollama.exe pause
ollama.exe serve
TIMEOUT /T 10