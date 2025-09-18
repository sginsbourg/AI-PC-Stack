@echo off
cd /d "C:\Users\sgins\AI_STACK\MeloTTS"
call venv-melo\Scripts\activate.bat
pip install -r requirements.txt
python ai_voice_assistant.py
pause