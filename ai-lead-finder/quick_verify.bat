@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

cd /d "%~dp0" & cls & color 0A

echo.
echo 🔍 Quick Setup Verification
echo.

set "ERRORS=0"

:: Critical files that must exist and be non-empty
set "CRITICAL_FILES[0]=docker-compose.yml"
set "CRITICAL_FILES[1]=setup.bat"
set "CRITICAL_FILES[2]=main_enhanced.py"
set "CRITICAL_FILES[3]=open-manus\app.py"
set "CRITICAL_FILES[4]=lead-analyzer\analyzer.py"
set "CRITICAL_FILES[5]=scripts\crawl.bat"
set "CRITICAL_FILES[6]=scripts\init_models.bat"

:: Critical directories
set "CRITICAL_DIRS[0]=open-manus"
set "CRITICAL_DIRS[1]=lead-analyzer"
set "CRITICAL_DIRS[2]=scripts"

echo Checking critical files...
for /l %%i in (0,1,6) do (
    if not exist "!CRITICAL_FILES[%%i]!" (
        echo ❌ MISSING: !CRITICAL_FILES[%%i]!
        set /a ERRORS+=1
    ) else (
        for %%F in ("!CRITICAL_FILES[%%i]!") do (
            if %%~zF equ 0 (
                echo ⚠️  EMPTY: !CRITICAL_FILES[%%i]!
                set /a ERRORS+=1
            ) else (
                echo ✅ !CRITICAL_FILES[%%i]!
            )
        )
    )
)

echo.
echo Checking critical directories...
for /l %%i in (0,1,2) do (
    if not exist "!CRITICAL_DIRS[%%i]!\" (
        echo ❌ MISSING: !CRITICAL_DIRS[%%i]!\ directory
        set /a ERRORS+=1
    ) else (
        echo ✅ !CRITICAL_DIRS[%%i]!\ directory
    )
)

echo.
if !ERRORS! equ 0 (
    echo 🎉 All critical files and directories are present!
    echo 🚀 System is ready for setup.
) else (
    echo ❌ Found !ERRORS! issue(s) that need to be resolved.
    echo 💡 Run 'verify_setup.bat' for detailed verification.
)

echo.
pause