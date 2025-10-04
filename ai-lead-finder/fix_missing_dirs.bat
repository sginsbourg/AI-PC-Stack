@echo off
chcp 65001 >nul

cd /d "%~dp0" & cls & color 0A

echo.
echo 🛠️  Fixing Missing Directories
echo.

set "DIRS_CREATED=0"

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
        mkdir "%%D" 2>nul
        if exist "%%D\" (
            echo ✅ Created: %%D\
            set /a DIRS_CREATED+=1
        ) else (
            echo ❌ Failed to create: %%D\
        )
    ) else (
        echo ℹ️  Already exists: %%D\
    )
)

echo.
if !DIRS_CREATED! gtr 0 (
    echo 🎉 Created !DIRS_CREATED! missing directories
) else (
    echo ℹ️  All directories already exist
)

echo.
echo 💡 Run 'verify_setup.bat' to check file status
echo.
pause