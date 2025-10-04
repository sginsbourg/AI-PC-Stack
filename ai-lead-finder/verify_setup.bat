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

:: Define file list in a more reliable way
set FILE_LIST[0]=docker-compose.yml
set FILE_LIST[1]=README.md
set FILE_LIST[2]=setup.bat
set FILE_LIST[3]=run.bat
set FILE_LIST[4]=check_services.bat
set FILE_LIST[5]=stop_services.bat
set FILE_LIST[6]=create_nutch_config.bat
set FILE_LIST[7]=main_enhanced.py
set FILE_LIST[8]=scripts\crawl.bat
set FILE_LIST[9]=scripts\init_models.bat
set FILE_LIST[10]=open-manus\Dockerfile
set FILE_LIST[11]=open-manus\requirements.txt
set FILE_LIST[12]=open-manus\app.py
set FILE_LIST[13]=lead-analyzer\Dockerfile
set FILE_LIST[14]=lead-analyzer\requirements.txt
set FILE_LIST[15]=lead-analyzer\analyzer.py

:: Define directory list
set DIR_LIST[0]=nutch_data
set DIR_LIST[1]=nutch_data\urls
set DIR_LIST[2]=nutch_data\conf
set DIR_LIST[3]=results
set DIR_LIST[4]=scripts
set DIR_LIST[5]=models
set DIR_LIST[6]=open-manus
set DIR_LIST[7]=lead-analyzer

echo 📁 Checking required files...
echo.

:: Check all files
for /l %%i in (0,1,15) do (
    set "FILE=!FILE_LIST[%%i]!"
    if "!FILE!"=="" (
        echo ⚠️  Skipping empty file entry at index %%i
    ) else (
        set /a TOTAL_FILES+=1
        if not exist "!FILE!" (
            echo ❌ MISSING: !FILE!
            set "ALL_FILES_EXIST=0"
            set /a MISSING_FILES+=1
        ) else (
            for %%F in ("!FILE!") do set "SIZE=%%~zF"
            if !SIZE! equ 0 (
                echo ⚠️  EMPTY: !FILE! (0 bytes)
                set "ALL_FILES_NON_EMPTY=0"
                set /a EMPTY_FILES+=1
            ) else (
                echo ✅ OK: !FILE! (!SIZE! bytes)
            )
        )
    )
)

echo.
echo 📁 Checking directory structure...
echo.

:: Check all directories
for /l %%i in (0,1,7) do (
    set "DIR=!DIR_LIST[%%i]!"
    if not exist "!DIR!\" (
        echo ❌ MISSING: !DIR!\ directory
        set "ALL_FILES_EXIST=0"
        set /a MISSING_FILES+=1
    ) else (
        echo ✅ OK: !DIR!\ directory exists
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
) else if !MISSING_FILES! gtr 0 (
    echo.
    echo 🔧 Run 'create_missing_files.bat' to create missing files
) else (
    echo ❌ Setup verification FAILED!
    echo.
    echo 💡 Please ensure all files are downloaded correctly.
    echo 💡 Re-download the package if files are missing.
)

echo.
pause