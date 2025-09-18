@echo off
cd /d "C:\Users\sgins\AI_STACK\MeloTTS"
call venv-melo\Scripts\activate.bat
pip install -r requirements.txt
set OLLAMA_HOST=127.0.0.1:11435
python ai_voice_assistant.py
pause