@echo off
echo ========================================
echo Starting FoneWorld Backend Server
echo ========================================
echo.

REM Stop any existing server on port 5000
echo Checking for existing server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Stopping existing server on port 5000...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 >nul
)

cd server
echo Installing dependencies if needed...
call npm install
echo.
echo Starting server...
echo Keep this window open while using the admin panel!
echo.
call npm start

