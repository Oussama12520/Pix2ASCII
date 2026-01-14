@echo off
cd /d "%~dp0"

echo ========================================
echo   Cobra ASCII Art Studio Launcher
echo ========================================
echo.

REM Check if server is already running
netstat -ano | findstr ":10000" >nul 2>&1
if %errorlevel% equ 0 (
    echo Dev server is already running!
    echo Just opening browser...
    echo.
    start http://localhost:10000
    echo ========================================
    echo   Browser opened: http://localhost:10000
    echo ========================================
    echo.
    pause
    exit
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the development server
echo Starting dev server...
start "Cobra Dev Server" cmd /k "npm run dev"

REM Wait for server to start
echo Waiting for server to start...
timeout /t 7 /nobreak >nul

REM Open browser
echo Opening browser...
start http://localhost:10000

echo.
echo ========================================
echo   Project started successfully!
echo   URL: http://localhost:10000
echo   Keep the dev server window open
echo ========================================
echo.
pause
