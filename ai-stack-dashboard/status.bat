@echo off
cd /d "C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\ai-stack-dashboard"

echo AI Dashboard Status Check
echo ========================
echo.

echo 1. Server process:
tasklist | findstr node.exe && echo ✅ Server is running || echo ❌ Server not running

echo.
echo 2. Port 3000 status:
netstat -ano | findstr :3000 && echo ✅ Port 3000 is active || echo ❌ Port 3000 not active

echo.
echo 3. Test connection:
curl -s http://localhost:3000 >nul && echo ✅ Dashboard responds || echo ❌ Dashboard not responding

echo.
echo 4. Open dashboard:
start http://localhost:3000

pause