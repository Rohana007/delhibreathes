#!/bin/bash

echo "========================================"
echo "Delhi Breathes - Unified Server Startup"
echo "========================================"
echo ""

# ============================================
# Step 1: Check Prerequisites
# ============================================
echo "[1/6] Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed"
    exit 1
fi
echo "[OK] Python found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    exit 1
fi
echo "[OK] Node.js found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed"
    exit 1
fi
echo "[OK] npm found"

echo ""

# ============================================
# Step 2: Kill processes on required ports
# ============================================
echo "[2/6] Checking for port conflicts..."

# Kill processes on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "[INFO] Killed process on port 8000" || echo "[OK] Port 8000 is free"

# Kill processes on port 8001
lsof -ti:8001 | xargs kill -9 2>/dev/null && echo "[INFO] Killed process on port 8001" || echo "[OK] Port 8001 is free"

# Kill processes on port 5000
lsof -ti:5000 | xargs kill -9 2>/dev/null && echo "[INFO] Killed process on port 5000" || echo "[OK] Port 5000 is free"

# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "[INFO] Killed process on port 3000" || echo "[OK] Port 3000 is free"

sleep 2
echo "[OK] Ports cleared"
echo ""

# ============================================
# Step 3: Create .env files if missing
# ============================================
echo "[3/6] Setting up environment files..."

if [ ! -f ".env" ]; then
    echo "[INFO] Creating .env file..."
    cat > .env << EOF
# Main Environment Variables for Delhi Breathes Project

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/delhibreathes

# FastAPI Server Ports
GAMIFICATION_PORT=8000
ML_PORT=8001

# Node.js Backend Port
NODE_PORT=5000

# Frontend Port
FRONTEND_PORT=3000

# JWT Secret
JWT_SECRET=localtestsecret

# CORS Origins
CORS_ORIGINS=*
EOF
    echo "[OK] Created .env"
else
    echo "[OK] .env already exists"
fi

if [ ! -f "backend/.env" ]; then
    echo "[INFO] Creating backend/.env file..."
    cat > backend/.env << EOF
# Node.js Backend Environment Variables

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/delhibreathes
MONGODB_URI=mongodb://localhost:27017/delhibreathes

# Server Port
PORT=5000
NODE_PORT=5000

# JWT Secret
JWT_SECRET=localtestsecret

# CORS Origins
CORS_ORIGINS=*
EOF
    echo "[OK] Created backend/.env"
else
    echo "[OK] backend/.env already exists"
fi

if [ ! -f "aqi-forecasting/.env" ]; then
    echo "[INFO] Creating aqi-forecasting/.env file..."
    cat > aqi-forecasting/.env << EOF
# ML Forecasting API Environment Variables

# Server Port
ML_PORT=8001

# Server Host
ML_HOST=0.0.0.0
EOF
    echo "[OK] Created aqi-forecasting/.env"
else
    echo "[OK] aqi-forecasting/.env already exists"
fi

echo ""

# ============================================
# Step 4: Install dependencies if needed
# ============================================
echo "[4/6] Checking dependencies..."

if [ ! -d "frontend/node_modules" ]; then
    echo "[INFO] Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "[OK] Frontend dependencies installed"
else
    echo "[OK] Frontend dependencies found"
fi

if [ ! -d "backend/node_modules" ]; then
    echo "[INFO] Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "[OK] Backend dependencies installed"
else
    echo "[OK] Backend dependencies found"
fi

echo ""

# ============================================
# Step 5: Start all servers
# ============================================
echo "[5/6] Starting all servers..."
echo ""

# Start Gamification Server (Port 8000)
echo "[INFO] Starting Gamification Server on port 8000..."
cd "$(dirname "$0")"
python3 gamification_server.py > logs/gamification.log 2>&1 &
GAMIFICATION_PID=$!
echo "[OK] Gamification Server started (PID: $GAMIFICATION_PID)"
sleep 3

# Start ML/AQI Forecasting Server (Port 8001)
echo "[INFO] Starting ML/AQI Forecasting Server on port 8001..."
cd aqi-forecasting
python3 run_api.py > ../logs/ml_server.log 2>&1 &
ML_PID=$!
cd ..
echo "[OK] ML Server started (PID: $ML_PID)"
sleep 3

# Start Node.js Backend (Port 5000)
echo "[INFO] Starting Node.js Backend on port 5000..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "[OK] Node.js Backend started (PID: $BACKEND_PID)"
sleep 3

# Start Frontend (Port 3000)
echo "[INFO] Starting Frontend on port 3000..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "[OK] Frontend started (PID: $FRONTEND_PID)"
sleep 5

echo "[OK] All servers started"
echo ""

# ============================================
# Step 6: Verify servers
# ============================================
echo "[6/6] Verifying servers..."
echo ""

sleep 5

# Test Gamification Server
echo "[TEST] Checking Gamification Server (http://localhost:8000)..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "[OK] Gamification Server is responding"
else
    echo "[WARN] Gamification Server may not be ready yet"
fi

# Test ML Server
echo "[TEST] Checking ML Server (http://localhost:8001)..."
if curl -s http://localhost:8001/health > /dev/null; then
    echo "[OK] ML Server is responding"
else
    echo "[WARN] ML Server may not be ready yet"
fi

# Test Node.js Backend
echo "[TEST] Checking Node.js Backend (http://localhost:5000)..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "[OK] Node.js Backend is responding"
else
    echo "[WARN] Node.js Backend may not be ready yet"
fi

echo ""
echo "========================================"
echo "[SUCCESS] All servers are starting!"
echo "========================================"
echo ""
echo "Server URLs:"
echo "  - Frontend:        http://localhost:3000"
echo "  - Node.js Backend: http://localhost:5000"
echo "  - Gamification:    http://localhost:8000"
echo "  - ML/AQI Forecast: http://localhost:8001"
echo ""
echo "Process IDs:"
echo "  - Gamification: $GAMIFICATION_PID"
echo "  - ML Server:    $ML_PID"
echo "  - Backend:      $BACKEND_PID"
echo "  - Frontend:     $FRONTEND_PID"
echo ""
echo "Logs are in the logs/ directory"
echo ""
echo "NOTE: If servers show errors, check:"
echo "  1. MongoDB is running (mongodb://localhost:27017)"
echo "  2. All dependencies are installed"
echo "  3. Ports are not blocked by firewall"
echo ""
echo "To stop all servers, run: kill $GAMIFICATION_PID $ML_PID $BACKEND_PID $FRONTEND_PID"
echo ""

