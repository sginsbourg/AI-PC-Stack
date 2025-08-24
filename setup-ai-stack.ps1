# Set error action to stop on first error to prevent a chain of failures.
$ErrorActionPreference = "Stop"

# Define the root directory for the AI stack.
$AISTACK_ROOT = "C:\Users\sgins\AI_STACK"

Write-Host "Starting AI Stack setup script with improved checks..." -ForegroundColor Green

# --- Step 1: Pre-flight checks for Python and Pip ---
Write-Host "Performing pre-flight checks..." -ForegroundColor Yellow
try {
    # Check if Python is in the PATH
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        throw "Python is not installed or not in your system's PATH. Please install Python 3.9+."
    }
    # Check if Pip is in the PATH
    if (-not (Get-Command pip -ErrorAction SilentlyContinue)) {
        throw "Pip is not installed or not in your system's PATH. It usually comes with Python."
    }
    Write-Host "Python and Pip verified." -ForegroundColor Green
} catch {
    Write-Host "Pre-flight check failed: $_" -ForegroundColor Red
    exit
}

# --- Step 2: Navigate to the correct directory and activate the virtual environment ---
Write-Host "Navigating to root directory: $AISTACK_ROOT" -ForegroundColor Yellow
cd $AISTACK_ROOT

# Ensure the virtual environment is active.
# This assumes the virtual environment is named 'venv' and located in the root.
if (-not (Test-Path "$AISTACK_ROOT\venv\Scripts\Activate.ps1")) {
    Write-Host "Virtual environment 'venv' not found. Please create it first with 'python -m venv venv' inside '$AISTACK_ROOT'." -ForegroundColor Red
    exit
}

Write-Host "Activating Python virtual environment..." -ForegroundColor Yellow
& "$AISTACK_ROOT\venv\Scripts\Activate.ps1"

# Check for a successful virtual environment activation
if (-not ($env:VIRTUAL_ENV)) {
    Write-Host "Failed to activate the virtual environment." -ForegroundColor Red
    exit
}
Write-Host "Virtual environment activated successfully." -ForegroundColor Green

# --- Step 3: Install and verify dependencies ---
# Function to check and install a Python package
function Install-Package {
    param(
        [string]$PackageName,
        [string]$FriendlyName
    )
    Write-Host "Checking for '$FriendlyName'..." -ForegroundColor Yellow
    try {
        # Use pip show to check if the package is already installed
        $check = pip show $PackageName
        if ($check) {
            Write-Host "'$FriendlyName' is already installed. Skipping." -ForegroundColor Green
            return
        }

        # If not installed, attempt to install it
        Write-Host "'$FriendlyName' not found. Installing..." -ForegroundColor Yellow
        pip install $PackageName

        if (-not $?) {
            throw "Failed to install '$FriendlyName'."
        }
        Write-Host "Successfully installed '$FriendlyName'." -ForegroundColor Green

    } catch {
        Write-Host "An error occurred during '$FriendlyName' installation: $_" -ForegroundColor Red
        Write-Host "Please check your internet connection or try to install it manually with 'pip install $PackageName'." -ForegroundColor Cyan
        exit
    }
}

# Install dependencies based on previous errors
Install-Package -PackageName "txtsplit" -FriendlyName "MeloTTS txtsplit dependency"
Install-Package -PackageName "sqlite-vec" -FriendlyName "sqlite_vec dependency"

# --- Step 4: Proactively check for Port 9000 availability ---
Write-Host "Checking if port 9000 is available..." -ForegroundColor Yellow
try {
    # Use netstat to check for listening processes on port 9000
    $process = Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -eq 9000 }
    if ($process) {
        Write-Host "Port 9000 is currently in use by a process with PID $($process.OwningProcess)." -ForegroundColor Red
        Write-Host "You must manually free up this port before trying to run the app again." -ForegroundColor Red
        Write-Host "Run this in a new Administrator terminal: 'taskkill /PID $($process.OwningProcess) /F'" -ForegroundColor Cyan
        exit
    }
    Write-Host "Port 9000 is available." -ForegroundColor Green
} catch {
    # Fallback for systems that may not have Get-NetTCPConnection
    Write-Host "Could not automatically check port availability. Proceeding..." -ForegroundColor Yellow
}

# --- Step 5: Correctly run the start_windows.bat file ---
Write-Host "Starting the 'tg-webui' application..." -ForegroundColor Green
Write-Host "Please note: A new window will open for the web server." -ForegroundColor Yellow
try {
    # Change directory to where the batch file is located.
    $batchFilePath = "$AISTACK_ROOT\tg-webui\start_windows.bat"
    if (-not (Test-Path $batchFilePath)) {
        throw "The file 'start_windows.bat' was not found at '$batchFilePath'."
    }
    cd "$AISTACK_ROOT\tg-webui"

    # Start the batch process in a new window.
    Start-Process -FilePath $batchFilePath -Wait

} catch {
    Write-Host "Failed to start 'start_windows.bat': $_" -ForegroundColor Red
    Write-Host "Please ensure the file exists at the specified path and you have permission to run it." -ForegroundColor Cyan
    exit
}

Write-Host ""
Write-Host "Setup script has completed." -ForegroundColor Green
Write-Host "If the web server window did not open, please check the output for any errors." -ForegroundColor Yellow

