# ==============================================================================
#  debug-services.ps1  |  A diagnostic script to manually start AI services
# ==============================================================================

$ErrorActionPreference = "Stop"
$baseDir = "$env:USERPROFILE\AI_STACK"
$logFile = "$baseDir\setup.log"

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

try {
    # ------------------------------------------------------------
    # Service Startup
    # ------------------------------------------------------------
    Log "Starting AI services in separate windows..."

    # Start Whisper API
    Log "Attempting to start Whisper API..."
    Start-Process -FilePath "python" -ArgumentList "-m uvicorn whisper_api:app --host 0.0.0.0 --port 9000" -WorkingDirectory $baseDir -WindowStyle Normal -Wait

    # Start Letta
    Log "Attempting to start Letta..."
    Start-Process -FilePath "python" -ArgumentList "-m letta server --model-endpoint http://localhost:11434/v1 --model llama3.1:8b" -WorkingDirectory $baseDir -WindowStyle Normal -Wait

    # Start MeloTTS
    Log "Attempting to start MeloTTS..."
    Start-Process -FilePath "python" -ArgumentList "melotts_api.py" -WorkingDirectory $baseDir -WindowStyle Normal -Wait

    # Start Text-Generation-WebUI (Correctly calling a .bat file)
    Log "Attempting to start Text-Generation-WebUI..."
    $command = ".\start_windows.bat"
    $tgWebuiDir = "$baseDir\tg-webui"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $command -WorkingDirectory $tgWebuiDir -WindowStyle Normal -Wait

    Log "All services launched. Please check the new PowerShell windows for errors."
} catch {
    Log "Script execution failed: $_" "ERROR"
}