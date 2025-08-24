# ==============================================================================
#  verify-ai-stack.ps1  |  Windows 11   |  Elevated PowerShell 7+  (Run as Admin)
#  Verifies installation and availability of AI stack components:
#  DeepSeek-R1, Ollama, OpenManus, LangChain, AutoGen, OpenSora, Haystack,
#  Text-Gen-WebUI, Whisper, Letta, MeloTTS
#  Suggests actions to update and ensure accessibility
# ==============================================================================

param(
    [switch]$AutoFix
)

$ErrorActionPreference = "Stop"
$baseDir = "$env:USERPROFILE\AI_STACK"
$logFile = "$baseDir\verify.log"
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
        "ACTION" { "Green" }
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

function Check-SystemRequirements {
    Log "Checking system requirements..."
    $issues = @()

    # PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt $minPowerShellVersion) {
        $issues += "PowerShell 7+ required. Current: $($PSVersionTable.PSVersion). Install with 'winget install Microsoft.PowerShell'"
    }

    # Disk space
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID = '$($env:SystemDrive[0]):'"
    if ($disk.FreeSpace / 1GB -lt $requiredDiskSpaceGB) {
        $issues += "Insufficient disk space. Required: ${requiredDiskSpaceGB}GB, Available: $([math]::Round($disk.FreeSpace / 1GB, 2))GB"
    }

    # Memory
    $memory = Get-CimInstance Win32_OperatingSystem
    if ($memory.TotalVisibleMemorySize / 1KB -lt $requiredMemoryMB) {
        $issues += "Insufficient memory. Required: ${requiredMemoryMB}MB, Available: $([math]::Round($memory.TotalVisibleMemorySize / 1KB, 2))MB"
    }

    if ($issues) {
        foreach ($issue in $issues) { Log $issue "ERROR" }
        if ($AutoFix) { Log "AutoFix not implemented for system requirements. Please address manually." "WARNING" }
        exit 1
    }
    Log "System requirements met"
}

function Check-Prerequisites {
    Log "Checking prerequisites..."
    $prereqs = @(
        @{Name = "winget"; Install = "Install App Installer from Microsoft Store"}
        @{Name = "git"; Install = "winget install --id Git.Git --silent --accept-package-agreements"}
        @{Name = "python"; Install = "winget install --id Python.Python.3.11 --silent --accept-package-agreements"}
        @{Name = "ollama"; Install = "winget install --id Ollama.Ollama --silent --accept-package-agreements"}
        @{Name = "docker"; Install = "winget install --id Docker.DockerDesktop --silent --accept-package-agreements"}
    )
    $issues = @()
    
    foreach ($prereq in $prereqs) {
        if (-not (Test-Command $prereq.Name)) {
            $issues += "Missing $($prereq.Name). Install with: $($prereq.Install)"
        } else {
            Log "$($prereq.Name) installed"
        }
    }

    if ($issues) {
        foreach ($issue in $issues) { Log $issue "ERROR" }
        if ($AutoFix) {
            Log "Attempting to install missing prerequisites..."
            foreach ($prereq in $prereqs) {
                if (-not (Test-Command $prereq.Name) -and $prereq.Name -ne "winget") {
                    Log "Running: $($prereq.Install)"
                    Invoke-Expression $prereq.Install
                    if ($LASTEXITCODE -ne 0) {
                        Log "Failed to install $($prereq.Name)" "ERROR"
                        exit 1
                    }
                }
            }
            if (-not (Test-Command "winget")) {
                Log "winget missing. Please install App Installer from Microsoft Store manually." "ERROR"
                exit 1
            }
        }
    }
}

function Check-Repositories {
    Log "Checking repositories..."
    $repos = @(
        @{Dir = "tg-webui"; Url = "https://github.com/oobabooga/text-generation-webui.git"}
        @{Dir = "OpenManus"; Url = "https://github.com/FoundationAgents/OpenManus.git"}
        @{Dir = "OpenSora"; Url = "https://github.com/hpcaitech/Open-Sora.git"}
    )
    $issues = @()

    foreach ($repo in $repos) {
        if (-not (Test-Path "$baseDir\$($repo.Dir)\.git")) {
            $issues += "Repository $($repo.Dir) missing. Clone with: git clone $($repo.Url) $baseDir\$($repo.Dir)"
        } else {
            Log "Checking updates for $($repo.Dir)..."
            $status = git -C "$baseDir\$($repo.Dir)" fetch origin --dry-run 2>&1
            if ($status -match "up to date") {
                Log "$($repo.Dir) is up to date"
            } else {
                $issues += "$($repo.Dir) has updates available. Run: git -C $baseDir\$($repo.Dir) pull"
            }
        }
    }

    if ($issues) {
        foreach ($issue in $issues) { Log $issue "WARNING" }
        if ($AutoFix) {
            Log "Updating repositories..."
            foreach ($repo in $repos) {
                if (Test-Path "$baseDir\$($repo.Dir)\.git") {
                    Log "Pulling updates for $($repo.Dir)"
                    git -C "$baseDir\$($repo.Dir)" pull
                    if ($LASTEXITCODE -ne 0) { Log "Failed to update $($repo.Dir)" "ERROR"; exit 1 }
                } else {
                    Log "Cloning $($repo.Dir)"
                    git clone $repo.Url "$baseDir\$($repo.Dir)"
                    if ($LASTEXITCODE -ne 0) { Log "Failed to clone $($repo.Dir)" "ERROR"; exit 1 }
                }
            }
        }
    }
}

function Check-PythonVenv {
    Log "Checking Python virtual environment..."
    $issues = @()
    
    if (-not (Test-Path "$baseDir\venv")) {
        $issues += "Virtual environment missing. Create with: python -m venv $baseDir\venv"
    } else {
        & "$baseDir\venv\Scripts\Activate.ps1"
        $packages = @("langchain", "langchain-community", "pyautogen", "haystack-ai", "sentence-transformers", "faiss-cpu", "openai-whisper", "fastapi", "uvicorn", "letta", "torch", "torchaudio", "melo")
        foreach ($pkg in $packages) {
            $installed = pip show $pkg 2>$null
            if (-not $installed) {
                $issues += "Python package $pkg missing. Install with: pip install $pkg"
            } else {
                Log "Python package $pkg installed"
            }
        }
        # Check for outdated packages
        $outdated = pip list --outdated --format=json | ConvertFrom-Json
        foreach ($pkg in $outdated) {
            $issues += "Python package $($pkg.name) is outdated. Current: $($pkg.version), Latest: $($pkg.latest_version). Update with: pip install --upgrade $($pkg.name)"
        }
    }

    if ($issues) {
        foreach ($issue in $issues) { Log $issue "WARNING" }
        if ($AutoFix) {
            Log "Setting up virtual environment and packages..."
            if (-not (Test-Path "$baseDir\venv")) {
                python -m venv "$baseDir\venv"
            }
            & "$baseDir\venv\Scripts\Activate.ps1"
            pip install --upgrade pip
            $packages = "langchain langchain-community pyautogen haystack-ai sentence-transformers faiss-cpu openai-whisper fastapi uvicorn letta git+https://github.com/myshell-ai/MeloTTS.git@main torch torchaudio --index-url https://download.pytorch.org/whl/cpu"
            pip install $packages
            if ($LASTEXITCODE -ne 0) { Log "Failed to install Python packages" "ERROR"; exit 1 }
        }
    }
}

function Check-Services {
    Log "Checking AI services..."
    $services = @(
        @{Name = "Ollama"; Url = "http://localhost:11434/v1"; Process = "ollama"}
        @{Name = "Text-Gen-WebUI"; Url = "http://localhost:5000"; Process = "python"; Args = "start_windows.bat"}
        @{Name = "Whisper"; Url = "http://localhost:9000/transcribe"; Process = "python"; Args = "whisper_api.py"}
        @{Name = "Letta"; Url = "http://localhost:8283"; Process = "python"; Args = "letta server"}
        @{Name = "MeloTTS"; Url = "http://localhost:8001/v1/audio/speech"; Process = "python"; Args = "melotts_api.py"}
    )
    $issues = @()

    foreach ($svc in $services) {
        $response = try { Invoke-WebRequest -Uri $svc.Url -Method Get -UseBasicParsing -TimeoutSec 5 } catch { $null }
        if ($response -and $response.StatusCode -eq 200) {
            Log "$($svc.Name) is running ($($svc.Url))"
        } else {
            $processRunning = Get-Process -Name $svc.Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$($svc.Args)*" }
            if ($processRunning) {
                Log "$($svc.Name) process is running but not responding at $($svc.Url). Check configuration or restart." "WARNING"
                $issues += "Restart $($svc.Name) with: Start-Process $($svc.Process) -ArgumentList '$($svc.Args)'"
            } else {
                $issues += "$($svc.Name) not running. Start with: Start-Process $($svc.Process) -ArgumentList '$($svc.Args)'"
            }
        }
    }

    if ($issues) {
        foreach ($issue in $issues) { Log $issue "WARNING" }
        if ($AutoFix) {
            Log "Attempting to start services..."
            foreach ($svc in $services) {
                $processRunning = Get-Process -Name $svc.Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$($svc.Args)*" }
                if (-not $processRunning) {
                    Log "Starting $($svc.Name)..."
                    if ($svc.Name -eq "Ollama") {
                        Start-Process "ollama" -ArgumentList "serve" -NoNewWindow -PassThru | Out-Null
                    } elseif ($svc.Name -eq "Text-Gen-WebUI") {
                        Start-Process "python" -WorkingDirectory "$baseDir\tg-webui" -ArgumentList ".\start_windows.bat" -NoNewWindow -PassThru | Out-Null
                    } elseif ($svc.Name -eq "Whisper") {
                        Start-Process "python" -ArgumentList "-m uvicorn whisper_api:app --host 0.0.0.0 --port 9000" -WorkingDirectory $baseDir -NoNewWindow -PassThru | Out-Null
                    } elseif ($svc.Name -eq "Letta") {
                        Start-Process "python" -ArgumentList "-m letta server --model-endpoint http://localhost:11434/v1 --model llama3.1:8b" -NoNewWindow -PassThru | Out-Null
                    } elseif ($svc.Name -eq "MeloTTS") {
                        Start-Process "python" -ArgumentList "$baseDir\melotts_api.py" -NoNewWindow -PassThru | Out-Null
                    }
                }
            }
        }
    }
}

function Check-Docker {
    Log "Checking Docker services..."
    $issues = @()
    
    if (Test-Command docker) {
        $container = docker ps -q -f name=openmanus
        if ($container) {
            Log "OpenManus Docker container is running"
        } else {
            $issues += "OpenManus container not running. Start with: docker-compose -f $baseDir\ai-stack-tts.yml up -d"
        }
        # Check Docker image updates
        $imageInfo = docker images foundationagents/openmanus --format "{{.Tag}}"
        if ($imageInfo -ne "latest") {
            $issues += "OpenManus Docker image may be outdated. Pull latest with: docker pull foundationagents/openmanus:latest"
        }
    } else {
        $issues += "Docker not installed. Install with: winget install --id Docker.DockerDesktop --silent --accept-package-agreements"
    }

    if ($issues) {
        foreach ($issue in $issues) { Log $issue "WARNING" }
        if ($AutoFix) {
            Log "Attempting to fix Docker issues..."
            if (-not (Test-Command docker)) {
                Log "Installing Docker Desktop..."
                winget install --id Docker.DockerDesktop --silent --accept-package-agreements
                Log "Docker installed. Reboot if prompted, then re-run script." "ACTION"
                exit 0
            }
            if (-not (docker ps -q -f name=openmanus)) {
                Log "Starting OpenManus container..."
                docker-compose -f "$baseDir\ai-stack-tts.yml" up -d
                if ($LASTEXITCODE -ne 0) { Log "Failed to start OpenManus container" "ERROR"; exit 1 }
            }
            Log "Pulling latest OpenManus image..."
            docker pull foundationagents/openmanus:latest
            if ($LASTEXITCODE -ne 0) { Log "Failed to pull OpenManus image" "ERROR"; exit 1 }
        }
    }
}

# ------------------------------------------------------------
# Main Execution
# ------------------------------------------------------------
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Log "This script must be run as Administrator" "ERROR"
    exit 1
}

New-Item -ItemType Directory -Force $baseDir | Out-Null
if (-not (Test-Path $logFile)) {
    New-Item -ItemType File -Path $logFile -Force | Out-Null
}

Log "Starting AI Stack verification..."
Check-SystemRequirements
Check-Prerequisites
Check-Repositories
Check-PythonVenv
Check-Services
Check-Docker
Log "Verification complete. Review warnings and actions above."
if ($AutoFix) { Log "All issues attempted to be fixed automatically." "ACTION" }
Log "To update all components, run: .\setup-ai-stack.ps1 in $baseDir"