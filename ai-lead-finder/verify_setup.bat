@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

cd /d "%~dp0" & cls & color 0A

echo.
echo ========================================
echo   AI Lead Finder - Setup Verification
echo ========================================
echo.

set "ALL_FILES_EXIST=1"
set "ALL_FILES_NON_EMPTY=1"
set "TOTAL_FILES=0"
set "MISSING_FILES=0"
set "EMPTY_FILES=0"

echo 📁 Checking required files...
echo.

:: Check files using a simpler approach
call :CheckFile "docker-compose.yml" "Docker Compose Configuration"
call :CheckFile "README.md" "Documentation"
call :CheckFile "setup.bat" "Main Setup Script"
call :CheckFile "run.bat" "Main Execution Script"
call :CheckFile "check_services.bat" "Service Check Script"
call :CheckFile "stop_services.bat" "Service Stop Script"
call :CheckFile "create_nutch_config.bat" "Nutch Configuration Script"
call :CheckFile "main_enhanced.py" "Main Python Application"

echo.
echo 📁 Checking script files...
echo.

call :CheckFile "scripts\crawl.bat" "Nutch Crawl Script"
call :CheckFile "scripts\init_models.bat" "AI Model Initialization Script"

echo.
echo 📁 Checking Open Manus AI files...
echo.

call :CheckFile "open-manus\Dockerfile" "Open Manus Dockerfile"
call :CheckFile "open-manus\requirements.txt" "Open Manus Python Requirements"
call :CheckFile "open-manus\app.py" "Open Manus AI Application"

echo.
echo 📁 Checking Lead Analyzer files...
echo.

call :CheckFile "lead-analyzer\Dockerfile" "Lead Analyzer Dockerfile"
call :CheckFile "lead-analyzer\requirements.txt" "Lead Analyzer Python Requirements"
call :CheckFile "lead-analyzer\analyzer.py" "Lead Analyzer Application"

echo.
echo 📁 Checking directory structure...
echo.

:: Check directories
for %%D in (
    nutch_data
    nutch_data\urls
    nutch_data\conf
    results
    scripts
    models
    open-manus
    lead-analyzer
) do (
    if not exist "%%D\" (
        echo ❌ MISSING: %%D\ directory
        set "ALL_FILES_EXIST=0"
        set /a MISSING_FILES+=1
    ) else (
        echo ✅ OK: %%D\ directory exists
    )
)

echo.
echo ========================================
echo 📊 VERIFICATION SUMMARY
echo ========================================
echo.
echo Files Checked: !TOTAL_FILES!
echo Missing Files: !MISSING_FILES!
echo Empty Files: !EMPTY_FILES!
echo.

if !ALL_FILES_EXIST! equ 1 (
    echo ✅ All required files are present
) else (
    echo ❌ Some files are missing
)

if !ALL_FILES_NON_EMPTY! equ 1 (
    echo ✅ All files are non-empty
) else (
    echo ⚠️  Some files are empty (may need configuration)
)

echo.
if !ALL_FILES_EXIST! equ 1 if !ALL_FILES_NON_EMPTY! equ 1 (
    echo 🎉 Setup verification PASSED!
    echo.
    echo 🚀 You can now run 'setup.bat' to start the system.
) else (
    echo ❌ Setup verification FAILED!
    echo.
    echo 🔧 Run 'create_missing_files.bat' to create missing files
)

echo.
pause
goto :EOF

:CheckFile
set "FILE=%~1"
set "DESCRIPTION=%~2"
set /a TOTAL_FILES+=1

if not exist "!FILE!" (
    echo ❌ MISSING: !DESCRIPTION!
    echo    File: !FILE!
    set "ALL_FILES_EXIST=0"
    set /a MISSING_FILES+=1
    goto :EOF
)

for %%F in ("!FILE!") do set "SIZE=%%~zF"
if !SIZE! equ 0 (
    echo ⚠️  EMPTY: !DESCRIPTION!
    echo    File: !FILE! (0 bytes)
    set "ALL_FILES_NON_EMPTY=0"
    set /a EMPTY_FILES+=1
) else (
    echo ✅ OK: !DESCRIPTION! (!SIZE! bytes)
)
goto :EOF