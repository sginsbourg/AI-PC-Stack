@echo off
title Setup AI Services
set "AI_STACK=C:\Users\sgins\AI_STACK"

echo 🔧 Setting up AI Services...
echo.

if not exist "%AI_STACK%" (
    echo Creating AI_STACK directory...
    mkdir "%AI_STACK%"
)

echo Step 1: Checking Python dependencies...
python --version
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

echo Step 2: Installing common dependencies...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install transformers requests beautifulsoup4 flask fastapi uvicorn

echo Step 3: Setting up individual services...
echo.

:: For now, let's create simple test servers for each service
echo Creating test servers for demonstration...

cd /d "%AI_STACK%"

:: Create simple test server for OpenSora
if not exist "OpenSora" mkdir "OpenSora"
(
echo from flask import Flask
echo import threading
echo app = Flask(__name__)
echo 
echo @app.route('/')
echo def home():
echo     return '''<html><head><title>OpenSora Test</title></head>
echo     <body style="font-family: Arial; padding: 40px;">
echo     <h1>OpenSora - Video Generation AI</h1>
echo     <p>This is a test server for OpenSora.</p>
echo     <p>Status: <span style="color: green;">Running</span></p>
echo     <p>Port: 8003</p>
echo     </body></html>'''
echo 
echo def run_server():
echo     app.run(host='127.0.0.1', port=8003, debug=False)
echo 
echo if __name__ == '__main__':
echo     print("OpenSora test server starting on port 8003...")
echo     run_server()
) > OpenSora\test_server.py

:: Create simple test server for MeloTTS
if not exist "MeloTTS" mkdir "MeloTTS"
(
echo from flask import Flask
echo app = Flask(__name__)
echo 
echo @app.route('/')
echo def home():
echo     return '''<html><body style="font-family: Arial; padding: 40px;">
echo     <h1>MeloTTS - Text to Speech</h1>
echo     <p>Test server running on port 8001</p>
echo     </body></html>'''
echo 
echo if __name__ == '__main__':
echo     app.run(port=8001, debug=False)
) > MeloTTS\test_server.py

:: Create simple test server for OpenManus  
if not exist "OpenManus" mkdir "OpenManus"
(
echo from flask import Flask
echo app = Flask(__name__)
echo 
echo @app.route('/')
echo def home():
echo     return '''<html><body style="font-family: Arial; padding: 40px;">
echo     <h1>OpenManus - AI Agent Framework</h1>
echo     <p>Test server running on port 8002</p>
echo     </body></html>'''
echo 
echo if __name__ == '__main__':
echo     app.run(port=8002, debug=False)
) > OpenManus\test_server.py

echo ✅ Test servers created!
echo.
echo You can now start the services using the dashboard.
echo.
pause