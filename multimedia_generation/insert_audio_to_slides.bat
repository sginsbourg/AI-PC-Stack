@echo off
echo Setting up virtual environment and running the audio insertion script...

cd /d "%~dp0" & cls & color 0A
set PATH=%PATH%;C:\Users\sgins\Python312;C:\Users\sgins\Python312\Scripts;C:\ffmpeg\bin;C:\Program Files\Git\bin;C:\Windows\System32;C:\Users\sgins\miniconda3\Scripts; & python.exe -m pip --upgrade pip

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip
pip install --upgrade pip

REM Install required packages
pip install python-pptx
pip install pywin32

REM Run the Python script
python "insert_audio_to_slides.py"

echo Script execution completed.
pause