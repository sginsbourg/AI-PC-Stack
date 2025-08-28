# ==============================================================================
#  check-services.ps1  |  Checks the online availability of AI stack services
# ==============================================================================

function Test-ServiceAvailability {
    param(
        [string]$Name,
        [string]$Url
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Name ($Url) is ONLINE" -ForegroundColor Green
        } else {
            Write-Host "🟡 $Name ($Url) is RESPONDING, but with status code $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $Name ($Url) is OFFLINE" -ForegroundColor Red
    }
}

Write-Host "Validating AI PC Stack Service Availability..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------"

# Test standard web services (Text-Gen-WebUI, Letta, MeloTTS)
Test-ServiceAvailability -Name "Text-Gen-WebUI" -Url "http://localhost:5000"
Test-ServiceAvailability -Name "Letta" -Url "http://localhost:8283"
Test-ServiceAvailability -Name "MeloTTS" -Url "http://localhost:8001/v1/audio/speech"

# Test Whisper FastAPI
Test-ServiceAvailability -Name "Whisper API" -Url "http://localhost:9000/transcribe"

# Test Ollama API (special case as it may not return a 200 on the root URL)
try {
    $ollamaResponse = Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($ollamaResponse) {
        Write-Host "✅ Ollama API (http://localhost:11434) is ONLINE" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Ollama API (http://localhost:11434) is OFFLINE" -ForegroundColor Red
}

Write-Host "---------------------------------------------------"
Write-Host "Validation complete." -ForegroundColor Cyan
