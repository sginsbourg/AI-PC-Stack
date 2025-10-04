@echo off
chcp 65001 >nul

cd /d "%~dp0" & cls & color 0A

echo.
echo Creating Missing Directories
echo.

set "DIRS_CREATED=0"

for %%D in (
    results
    models
) do (
    if not exist "%%D\" (
        mkdir "%%D"
        if exist "%%D\" (
            echo Created: %%D\
            set /a DIRS_CREATED+=1
        ) else (
            echo Failed to create: %%D\
        )
    ) else (
        echo Already exists: %%D\
    )
)

echo.
if !DIRS_CREATED! gtr 0 (
    echo Created !DIRS_CREATED! missing directories
) else (
    echo All directories already exist
)

echo.
echo Running final verification...
echo.
pause
verify_setup_fixed.bat