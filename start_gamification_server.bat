@echo off
echo ========================================
echo DelhiBreathes Gamification Engine
echo ========================================
echo.
echo Checking prerequisites...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo [OK] Python is available
echo.

REM Check if MongoDB is running (optional check)
tasklist | findstr /i mongod >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MongoDB process not found
    echo [INFO] Make sure MongoDB is running before starting the server
    echo [INFO] If MongoDB is installed as a service, it may still be running
    echo.
)

echo Starting Gamification Server...
echo [INFO] Server will run on port 8001
echo [INFO] Keep this window open while using the app
echo.
echo ========================================
echo.

python gamification_server.py

if errorlevel 1 (
    echo.
    echo ========================================
    echo [ERROR] Server failed to start
    echo ========================================
    echo.
    echo Common issues:
    echo 1. MongoDB is not running
    echo    - Start MongoDB: net start MongoDB
    echo    - Or check: sc query MongoDB
    echo.
    echo 2. Port 8000 is already in use
    echo    - Check: netstat -ano ^| findstr :8000
    echo.
    echo 3. Missing Python dependencies
    echo    - Run: pip install -r requirements_gamification.txt
    echo.
)

pause

