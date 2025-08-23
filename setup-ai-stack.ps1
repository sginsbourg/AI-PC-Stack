# Create a brand-new file that PowerShell can parse
@"
param([switch]`$SkipDocker, [switch]`$Uninstall)
`$ErrorActionPreference = 'Stop'
`$baseDir = "`$env:USERPROFILE\AI_STACK"
function Log(`$Msg) { Write-Host `$Msg -ForegroundColor Cyan }

if (`$Uninstall) {
    Log 'Removing stack...'
    try { docker-compose -f "`$baseDir\ai-stack-tts.yml" down --remove-orphans } catch {}
    Remove-Item -Recurse -Force `$baseDir -ErrorAction SilentlyContinue
    Log 'Done'; exit 0
}

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Log 'Run as Administrator'; exit 1
}

Log 'Installing prerequisites...'
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { Log 'winget missing'; exit 1 }
winget install --id Git.Git --silent --accept-package-agreements
winget install --id Python.Python.3.11 --silent --accept-package-agreements
winget install --id Ollama.Ollama --silent --accept-package-agreements
if (-not `$SkipDocker -and -not (Get-Command docker -ErrorAction SilentlyContinue)) {
    winget install --id Docker.DockerDesktop --silent --accept-package-agreements --accept-source-agreements
    Log 'Docker installed – reboot if prompted then re-run with -SkipDocker'; exit 0
}

New-Item -ItemType Directory -Force `$baseDir | Out-Null
Set-Location `$baseDir
if (-not (Test-Path 'tg-webui\.git'))  { git clone https://github.com/oobabooga/text-generation-webui.git tg-webui }
if (-not (Test-Path 'OpenManus\.git')) { git clone https://github.com/FoundationAgents/OpenManus.git OpenManus }

Start-Process 'ollama' -ArgumentList 'serve' -PassThru | Out-Null
ollama pull llama3.1:8b
ollama pull deepseek-r1:7b
Log 'Ollama -> http://localhost:11434/v1'

python -m venv venv
.\venv\Scripts\activate
pip install -U pip
pip install langchain langchain-community pyautogen haystack-ai sentence-transformers faiss-cpu openai-whisper fastapi uvicorn letta orpheus-tts

Start-Process 'python' -WorkingDirectory 'tg-webui' -ArgumentList '.\start_windows.bat' -PassThru | Out-Null
Log 'Text-Gen-WebUI -> http://localhost:5000'

@'
from fastapi import FastAPI, UploadFile
import whisper, tempfile, os
app = FastAPI()
model = whisper.load_model("base")
@app.post("/transcribe")
async def transcribe(file: UploadFile):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        result = model.transcribe(tmp.name); os.unlink(tmp.name)
    return {"text": result["text"]}
'@ | Out-File 'whisper_api.py' -Encoding ASCII
Start-Process 'python' -ArgumentList '-m uvicorn whisper_api:app --host 0.0.0.0 --port 9000' -PassThru | Out-Null
Log 'Whisper -> http://localhost:9000/transcribe'

Start-Process 'python' -ArgumentList '-m letta server --model-endpoint http://localhost:11434/v1 --model llama3.1:8b' -PassThru | Out-Null
Log 'Letta -> http://localhost:8283'

Start-Process 'python' -ArgumentList '-m orpheus.serve --model 1b --host 0.0.0.0 --port 8001' -PassThru | Out-Null
Log 'Orpheus-TTS -> http://localhost:8001/v1/audio/speech'

if (-not `$SkipDocker) {
    @'
version: "3.9"
services:
  openmanus:
    image: foundationagents/openmanus:latest
    ports:
      - "3000:3000"
    environment:
      OLLAMA_URL: http://host.docker.internal:11434
  orpheus:
    image: canopyai/orpheus-tts:latest
    ports:
      - "8001:8001"
    command: ["python","-m","orpheus.serve","--model","1b","--host","0.0.0.0","--port","8001"]
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
'@ | Out-File 'ai-stack-tts.yml' -Encoding ASCII
    docker-compose -f 'ai-stack-tts.yml' up -d
    Log 'Docker services up'
}

Log 'All services running - see URLs above'
"@ | Out-File "$env:USERPROFILE\setup-clean.ps1" -Encoding ASCII

# Run it
& "$env:USERPROFILE\setup-clean.ps1"
