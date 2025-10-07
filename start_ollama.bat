@echo off
openmanus_web.py
title Ollama
cd /d "C:\Users\sgins\AppData\Local\Programs\Ollama"
set OLLAMA_HOST=127.0.0.1:11435
ollama.exe serve
pause