# ==============================================================================
#  setup-ai-stack.ps1  |  Windows 11   |  Elevated PowerShell 7+  (Run as Admin)
#  Installs & starts:  DeepSeek-R1, Ollama, OpenManus, LangChain, AutoGen,
#                      OpenSora, Haystack, Text-Gen-WebUI, Whisper, Letta, MeloTTS
# ==============================================================================

param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$baseDir = "$env:USERPROFILE\AI_STACK"
$logFile = "$baseDir\setup.log"
$minPowerShellVersion = 7
$requiredDiskSpaceGB = 20
$requiredMemoryMB = 4096

function Log {
    param(
        [string]$Msg,
        [string]$Level = "INFO"
    )
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        default { "Cyan" }
    }
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Level - $Msg" -ForegroundColor $color
    Add-Content $logFile "[$timestamp] $Level - $Msg"
}

function Test-Command {
    param($Command)
    return Get-Command $Command -ErrorAction SilentlyContinue
}

function Validate-System {
    Log "Validating system requirements..."
    
    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt $minPowerShellVersion) {
        Log "PowerShell 7+ required. Current version: $($PSVersionTable.PSVersion)" "ERROR"
        exit 1
    }
    
    # Check disk space
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID = '$($env:SystemDrive[0]):'"
    if ($disk.FreeSpace / 1GB -lt $requiredDiskSpaceGB) {
        Log "Insufficient disk space. Required: ${requiredDiskSpaceGB}GB, Available: $([math]::Round($disk.FreeSpace / 1GB, 2))GB" "ERROR"
        exit 1
    }
    
    # Check memory
    $memory = Get-CimInstance Win32_OperatingSystem
    if ($memory.TotalVisibleMemorySize / 1KB -lt $requiredMemoryMB) {
        Log "Insufficient memory. Required: ${requiredMemoryMB}MB, Available: $([math]::Round($memory.TotalVisibleMemorySize / 1KB, 2))MB" "ERROR"
        exit 1
    }
    
    Log "System requirements validated"
}

# ------------------------------------------------------------
# Uninstall
# ------------------------------------------------------------
if ($Uninstall) {
    Log "Uninstalling AI Stack..."
    try {
        if (Test-Path $baseDir) {
            Remove-Item -Recurse -Force $baseDir -ErrorAction SilentlyContinue
            Log "Uninstallation complete"
        } else {
            Log "Nothing to uninstall - $baseDir does not exist" "WARNING"
        }
    } catch {
        Log "Error during uninstall: $_" "ERROR"
        exit 1
    }
    exit 0
}

# ------------------------------------------------------------
# Admin check
# ------------------------------------------------------------
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Log "This script must be run as Administrator" "ERROR"
    exit 1
}

# ------------------------------------------------------------
# Prereqs
# ------------------------------------------------------------
Log "Installing prerequisites..."
Validate-System

New-Item -ItemType Directory -Force $baseDir | Out-Null
if (-not (Test-Path $logFile)) {
    New-Item -ItemType File -Path $logFile -Force | Out-Null
}

$progress = 0
$totalSteps = 8
function Update-Progress {
    $progress++
    $percent = [math]::Round(($progress / $totalSteps) * 100)
    Log "Progress: $percent% ($progress/$totalSteps)"
}

if (-not (Test-Command winget)) {
    Log "winget is missing – please install App Installer from Microsoft Store" "ERROR"
    exit 1
}

$wingetPackages = @(
    #@{Id = "Git.Git"; Name = "Git"},
    #@{Id = "Python.Python.3.11"; Name = "Python 3.11"},
    #@{Id = "Ollama.Ollama"; Name = "Ollama"}
)
foreach ($pkg in $wingetPackages) {
    if (-not (Test-Command $pkg.Name.ToLower())) {
        Log "Installing $($pkg.Name)..."
        winget install --id $pkg.Id --silent --accept-package-agreements
        if ($LASTEXITCODE -ne 0) {
            Log "Failed to install $($pkg.Name)" "ERROR"
            exit 1
        }
    } else {
        Log "$($pkg.Name) already installed"
    }
}

Update-Progress

# ------------------------------------------------------------
# Folders & repos
# ------------------------------------------------------------
Set-Location $baseDir

function Clone-IfNeeded {
    param($repo, $dir)
    try {
        if (-not (Test-Path "$dir\.git")) {
            Log "Cloning $repo -> $dir"
            git clone $repo $dir
            if ($LASTEXITCODE -ne 0) { throw "Git clone failed for $repo" }
        } else {
            Log "Pulling $dir"
            git -C $dir pull
            if ($LASTEXITCODE -ne 0) { throw "Git pull failed for $dir" }
        }
    } catch {
        Log "Error cloning/pulling ${repo}: $_" "ERROR"
        exit 1
    }
}

$repos = @(
    @{Repo = "https://github.com/oobabooga/text-generation-webui.git"; Dir = "tg-webui"},
    @{Repo = "https://github.com/myshell-ai/MeloTTS.git"; Dir = "MeloTTS"},
    @{Repo = "https://github.com/myshell-ai/txtsplit.git"; Dir = "txtsplit"}
)
foreach ($r in $repos) {
    Clone-IfNeeded $r.Repo $r.Dir
}
Update-Progress

# ------------------------------------------------------------
# Ollama
# ------------------------------------------------------------
Log "Setting up Ollama..."
$ollamaPath = "C:\Users\sgins\AppData\Local\Programs\Ollama"
try {
    if (-not (Get-Process "ollama" -ErrorAction SilentlyContinue)) {
        Start-Process "$ollamaPath\ollama.exe" -ArgumentList "serve" -NoNewWindow -PassThru | Out-Null
    }
    foreach ($model in @("llama3.1:8b", "deepseek-r1:7b")) {
        Log "Pulling $model..."
        & "$ollamaPath\ollama.exe" pull $model
        if ($LASTEXITCODE -ne 0) { throw "Failed to pull $model" }
    }
    Log "Ollama -> http://localhost:11434/v1"
} catch {
    Log "Ollama setup failed: $_" "ERROR"
    exit 1
}
Update-Progress

# ------------------------------------------------------------
# Python venv + packages
# ------------------------------------------------------------
Log "Setting up Python virtual environment..."
try {
    if (-not (Test-Path "venv")) {
        python -m venv venv
    }
    .\venv\Scripts\Activate.ps1
    pip install --upgrade pip --no-cache-dir
    
    $packages = @("langchain", "langchain-community", "pyautogen", "haystack-ai", "sentence-transformers", "faiss-cpu", "openai-whisper", "fastapi", "uvicorn", "letta")
    
    Log "Installing Python packages individually..."
    foreach ($pkg in $packages) {
        Log "Installing $pkg..."
        pip install $pkg --no-cache-dir
        if ($LASTEXITCODE -ne 0) { throw "Failed to install $pkg" }
    }
} catch {
    Log "Python setup failed: $_" "ERROR"
    exit 1
}
Update-Progress

# ------------------------------------------------------------
# Text-Gen-WebUI
# ------------------------------------------------------------
Log "Starting Text-Gen-WebUI..."
try {
    # Fix for transformers compatibility issue
    Log "Installing compatible version of transformers..."
    pip install transformers==4.26.1
    
    if (-not (Test-Path "$baseDir\tg-webui\start_windows.bat")) {
        throw "Text-Gen-WebUI start script not found"
    }
    Start-Process "python" -WorkingDirectory "$baseDir\tg-webui" -ArgumentList ".\start_windows.bat" -NoNewWindow -PassThru | Out-Null
    Log "Text-Gen-WebUI -> http://localhost:5000"
} catch {
    Log "Text-Gen-WebUI setup failed: $_" "ERROR"
    exit 1
}
Update-Progress

# ------------------------------------------------------------
# Whisper FastAPI
# ------------------------------------------------------------
Log "Setting up Whisper FastAPI..."
try {
    @"
from fastapi import FastAPI, UploadFile
import whisper, tempfile, os
app = FastAPI()
model = whisper.load_model("base")
@app.post("/transcribe")
async def transcribe(file: UploadFile):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        result = model.transcribe(tmp.name)
        os.unlink(tmp.name)
    return {"text": result["text"]}
"@ | Out-File "$baseDir\whisper_api.py" -Encoding utf8
    Start-Process "python" -ArgumentList "-m uvicorn whisper_api:app --host 0.0.0.0 --port 9000" -NoNewWindow -PassThru | Out-Null
    Log "Whisper -> http://localhost:9000/transcribe"
} catch {
    Log "Whisper setup failed: $_" "ERROR"
    exit 1
}
Update-Progress

# ------------------------------------------------------------
# Letta
# ------------------------------------------------------------
Log "Setting up Letta..."
try {
    Start-Process "python" -ArgumentList "-m letta server --model-endpoint http://localhost:11434/v1 --model llama3.1:8b" -NoNewWindow -PassThru | Out-Null
    Log "Letta -> http://localhost:8283"
} catch {
    Log "Letta setup failed: $_" "ERROR"
    exit 1
}
Update-Progress

# ------------------------------------------------------------
# MeloTTS
# ------------------------------------------------------------
Log "Installing MeloTTS..."
try {
    Log "Installing `txtsplit` dependency..."
    Set-Location "$baseDir\txtsplit"
    pip install . --no-cache-dir
    
    Log "Installing `MeloTTS`..."
    Set-Location "$baseDir\MeloTTS"
    pip install . --no-cache-dir
    Set-Location $baseDir
    if ($LASTEXITCODE -ne 0) { throw "Failed to install MeloTTS" }

    @"
from melo.api import TTS
import uvicorn, io, base64, tempfile, os
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
tts = TTS(language="EN", device="cpu")

class TTSReq(BaseModel):
    text: str
    speaker: str = "EN-US"

@app.post("/v1/audio/speech")
def speak(req: TTSReq):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tts.tts_to_file(req.text, speaker=req.speaker, output_path=tmp.name)
        tmp.seek(0)
        audio = tmp.read()
        os.unlink(tmp.name)
    return {"audio": base64.b64encode(audio).decode()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
"@ | Out-File "$baseDir\melotts_api.py" -Encoding utf8
    Start-Process "python" -ArgumentList "$baseDir\melotts_api.py" -NoNewWindow -PassThru | Out-Null
    Log "MeloTTS -> http://localhost:8001/v1/audio/speech"
} catch {
    Log "MeloTTS setup failed: $_" "ERROR"
    exit 1
}
Update-Progress

# ------------------------------------------------------------
Log "All services running - see URLs above"