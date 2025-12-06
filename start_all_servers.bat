@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Delhi Breathes - Unified Server Startup
echo ========================================
echo.

REM ============================================
REM Step 1: Check Prerequisites
REM ============================================
echo [1/6] Checking prerequisites...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)
echo [OK] Python found

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)
echo [OK] npm found

echo.

REM ============================================
REM Step 2: Kill processes on required ports
REM ============================================
echo [2/6] Checking for port conflicts...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [INFO] Killing process on port 8000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001" ^| findstr "LISTENING"') do (
    echo [INFO] Killing process on port 8001 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo [INFO] Killing process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [INFO] Killing process on port 3000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo [OK] Ports cleared

echo.

REM ============================================
REM Step 3: Create .env files if missing
REM ============================================
echo [3/6] Setting up environment files...

if not exist ".env" (
    echo [INFO] Creating .env file...
    (
        echo # Main Environment Variables for Delhi Breathes Project
        echo.
        echo # MongoDB Configuration
        echo MONGODB_URI=mongodb://localhost:27017/delhibreathes
        echo.
        echo # FastAPI Server Ports
        echo GAMIFICATION_PORT=8000
        echo ML_PORT=8001
        echo.
        echo # Node.js Backend Port
        echo NODE_PORT=5000
        echo.
        echo # Frontend Port
        echo FRONTEND_PORT=3000
        echo.
        echo # JWT Secret
        echo JWT_SECRET=localtestsecret
        echo.
        echo # CORS Origins
        echo CORS_ORIGINS=*
    ) > .env
    echo [OK] Created .env
) else (
    echo [OK] .env already exists
)

if not exist "backend\.env" (
    echo [INFO] Creating backend/.env file...
    (
        echo # Node.js Backend Environment Variables
        echo.
        echo # MongoDB Configuration
        echo MONGO_URI=mongodb://localhost:27017/delhibreathes
        echo MONGODB_URI=mongodb://localhost:27017/delhibreathes
        echo.
        echo # Server Port
        echo PORT=5000
        echo NODE_PORT=5000
        echo.
        echo # JWT Secret (must match root .env)
        echo JWT_SECRET=localtestsecret
        echo VERIFICATION_TOKEN_SECRET=localtestsecret
        echo.
        echo # CORS Origins
        echo CORS_ORIGINS=*
    ) > backend\.env
    echo [OK] Created backend/.env
) else (
    echo [OK] backend/.env already exists
)

if not exist "aqi-forecasting\.env" (
    echo [INFO] Creating aqi-forecasting/.env file...
    (
        echo # ML Forecasting API Environment Variables
        echo.
        echo # Server Port
        echo ML_PORT=8001
        echo.
        echo # Server Host
        echo ML_HOST=0.0.0.0
    ) > aqi-forecasting\.env
    echo [OK] Created aqi-forecasting/.env
) else (
    echo [OK] aqi-forecasting/.env already exists
)

echo.

REM ============================================
REM Step 4: Install dependencies if needed
REM ============================================
echo [4/6] Checking dependencies...

if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies found
)

if not exist "backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo [OK] Backend dependencies installed
) else (
    echo [OK] Backend dependencies found
)

echo.

REM ============================================
REM Step 5: Start all servers
REM ============================================
echo [5/6] Starting all servers...
echo.

REM Start Gamification Server (Port 8000)
echo [INFO] Starting Gamification Server on port 8000...
start "Gamification Server (8000)" cmd /k "python gamification_server.py"
timeout /t 3 /nobreak >nul

REM Start ML/AQI Forecasting Server (Port 8001)
echo [INFO] Starting ML/AQI Forecasting Server on port 8001...
start "ML Server (8001)" cmd /k "cd aqi-forecasting && python run_api.py"
timeout /t 3 /nobreak >nul

REM Start Node.js Backend (Port 5000)
echo [INFO] Starting Node.js Backend on port 5000...
start "Node.js Backend (5000)" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Frontend (Port 3000)
echo [INFO] Starting Frontend on port 3000...
start "Frontend (3000)" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo [OK] All servers started
echo.

REM ============================================
REM Step 6: Verify servers
REM ============================================
echo [6/6] Verifying servers...
echo.

timeout /t 5 /nobreak >nul

REM Test Gamification Server
echo [TEST] Checking Gamification Server (http://localhost:8000)...
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo [WARN] Gamification Server may not be ready yet
) else (
    echo [OK] Gamification Server is responding
)

REM Test ML Server
echo [TEST] Checking ML Server (http://localhost:8001)...
curl -s http://localhost:8001/health >nul 2>&1
if errorlevel 1 (
    echo [WARN] ML Server may not be ready yet
) else (
    echo [OK] ML Server is responding
)

REM Test Node.js Backend
echo [TEST] Checking Node.js Backend (http://localhost:5000)...
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARN] Node.js Backend may not be ready yet
) else (
    echo [OK] Node.js Backend is responding
)

echo.
echo ========================================
echo [SUCCESS] All servers are starting!
echo ========================================
echo.
echo Server URLs:
echo   - Frontend:        http://localhost:3000
echo   - Node.js Backend: http://localhost:5000
echo   - Gamification:    http://localhost:8000
echo   - ML/AQI Forecast: http://localhost:8001
echo.
echo Keep these windows open while using the app.
echo.
echo NOTE: If servers show errors, check:
echo   1. MongoDB is running (mongodb://localhost:27017)
echo   2. All dependencies are installed
echo   3. Ports are not blocked by firewall
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul
