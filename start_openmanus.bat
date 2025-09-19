@echo off
title OpenManusAI
cd /d "C:\Users\sgins\AI_STACK\OpenManus"
pip install -r requirements.txt
set OLLAMA_HOST=127.0.0.1:11435
streamlit run openmanus_web.py
pause