@echo off
  color 1F
  title AI HUB Windows Batch

  setlocal enabledelayedexpansion

  :: Step 1: Change to target directory
  set "START1=%TIME%"
  cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack"
  if errorlevel 1 (
      echo ERROR: Could not change directory.
      goto :ERROR
  )
  set "END1=%TIME%"

  :: Step 2: Install Node.js dependencies
  set "START2=%TIME%"
  if not exist node_modules (
      npm install
      if errorlevel 1 (
          echo ERROR: Failed to install dependencies.
          goto :ERROR
      )
  )
  set "END2=%TIME%"

  :: Step 3: Run server.js
  set "START3=%TIME%"
  node server.js
  if errorlevel 1 (
      echo ERROR: Failed to run server.js.
      goto :ERROR
  )
  set "END3=%TIME%"

  :: Show timing info
  echo.
  echo Stage timings:
  call :DisplayTime "CD to directory" %START1% %END1%
  call :DisplayTime "Install dependencies" %START2% %END2%
  call :DisplayTime "Run server.js" %START3% %END3%

  goto :EOF

  :DisplayTime
  set "start=%2"
  set "end=%3"
  for /f "tokens=1-4 delims=:." %%a in ("%start%") do (
      set "sh=%%a"
      set "sm=%%b"
      set "ss=%%c"
      set "shs=%%d"
  )
  for /f "tokens=1-4 delims=:." %%a in ("%end%") do (
      set "eh=%%a"
      set "em=%%b"
      set "es=%%c"
      set "ehs=%%d"
  )
  set /a "starttotal=(sh*3600)+(sm*60)+ss"
  set /a "endtotal=(eh*3600)+(em*60)+es"
  set /a "secs = endtotal - starttotal"
  echo %~1: !secs! sec
  goto :EOF

  :ERROR
  echo Batch file terminated due to error.
  pause
  exit /b 1