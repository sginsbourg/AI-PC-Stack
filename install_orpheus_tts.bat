@echo off
setlocal enabledelayedexpansion

color 0A
title Orpheus-TTS Installer

set "TARGET_DIR=C:\Users\sgins\AI_STACK"
set "PROJECT_DIR=%TARGET_DIR%\Orpheus-TTS"
set "VENV_NAME=orpheus_env"

echo [+] Starting Orpheus-TTS setup (via Hugging Face only)...
echo [+] Target: %PROJECT_DIR%

cd /d "%PROJECT_DIR%"

:: Create virtual environment
python -m venv %VENV_NAME%
call %VENV_NAME%\Scripts\activate.bat

:: Upgrade pip
python -m pip install --upgrade pip

:: Install PyTorch (CPU)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

:: Install required packages
pip install transformers accelerate huggingface_hub soundfile scipy numpy

:: Create inference script
echo from transformers import VitsModel, VitsTokenizer
echo import torch
echo import soundfile as sf
echo import sys
echo.
echo def main():
echo     text = sys.argv[1] if len(sys.argv) ^> 1 else "Hello, this is Orpheus TTS."
echo     output_path = sys.argv[2] if len(sys.argv) ^> 2 else "output.wav"
echo.
echo     print(f"[+] Loading Orpheus-TTS model...")
echo     model = VitsModel.from_pretrained("yl4579/Orpheus-TTS")
echo     tokenizer = VitsTokenizer.from_pretrained("yl4579/Orpheus-TTS")
echo.
echo     inputs = tokenizer(text, return_tensors="pt")
echo     with torch.no_grad():
echo         output = model(**inputs).waveform
echo.
echo     audio = output.squeeze().cpu().numpy()
echo     sf.write(output_path, audio, model.config.sampling_rate)
echo     print(f"[+] Audio saved to {output_path}")
echo.
echo if __name__ == "__main__":
echo     main()
> inference.py

:: Download model (will cache automatically on first run, but we pre-download)
echo [+] Downloading model from Hugging Face (this may take a few minutes)...
python -c "from transformers import VitsModel, VitsTokenizer; print('Downloading model...'); VitsModel.from_pretrained('yl4579/Orpheus-TTS'); print('Model cached.')"

echo.
echo =============================================
echo ✅ Setup complete!
echo.
echo To generate speech:
echo   cd /d %PROJECT_DIR%
echo   %VENV_NAME%\Scripts\activate
echo   python inference.py "Hello world" test.wav
echo =============================================

pause