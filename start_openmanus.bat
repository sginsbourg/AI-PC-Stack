@echo off
cd /d "C:\Users\sgins\AI_STACK\OpenManus"
pip install -r requirements.txt
pip install streamlit
streamlit run openmanus_web.py
pause