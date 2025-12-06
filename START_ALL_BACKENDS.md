# Complete Backend Setup Guide

## All Backend Servers

Your application uses **3 backend servers**:

### 1. Node.js Backend (Main API)
- **Port:** 5000
- **Location:** `backend/src/server.js`
- **Purpose:** 
  - User authentication
  - Pollution reports
  - Safe routes
  - Main API endpoints
- **Start Command:**
  ```bash
  cd backend
  npm run dev
  ```

### 2. Gamification Server (FastAPI)
- **Port:** 8000
- **Location:** `gamification_server.py`
- **Purpose:**
  - Green Points system
  - Badges and rewards
  - Personalized alerts
  - Gamification engine
- **Start Command:**
  ```bash
  python gamification_server.py
  ```

### 3. ML/AQI Forecasting Server (FastAPI)
- **Port:** 8001
- **Location:** `aqi-forecasting/run_api.py`
- **Purpose:**
  - 24-hour AQI forecasts
  - 72-hour AQI forecasts
  - ML predictions
- **Start Command:**
  ```bash
  cd aqi-forecasting
  python run_api.py
  ```

---

## Quick Start (All Servers)

### Option 1: Start Each Server Separately

**Terminal 1 - Node.js Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Gamification Server:**
```bash
python gamification_server.py
```

**Terminal 3 - ML Server:**
```bash
cd aqi-forecasting
python run_api.py
```

### Option 2: Use Batch Scripts

**For FastAPI Servers Only:**
```bash
start_all_servers.bat
```

**Note:** This only starts the FastAPI servers (ports 8000 and 8001). You still need to start the Node.js backend separately.

---

## Server URLs

| Server | URL | API Docs |
|--------|-----|----------|
| Node.js Backend | http://localhost:5000 | http://localhost:5000/api |
| Gamification | http://localhost:8000 | http://localhost:8000/docs |
| ML/AQI | http://localhost:8001 | http://localhost:8001/docs |

---

## Prerequisites

### MongoDB
All servers require MongoDB:
```bash
net start MongoDB
```

### Node.js Dependencies
```bash
cd backend
npm install
```

### Python Dependencies
```bash
# Gamification server
pip install -r requirements_gamification.txt

# ML server
cd aqi-forecasting
pip install -r requirements.txt
```

---

## Verify All Servers

### Check Node.js Backend (5000)
```bash
curl http://localhost:5000/api/health
```

### Check Gamification Server (8000)
```bash
curl http://localhost:8000/
```

### Check ML Server (8001)
```bash
curl http://localhost:8001/
```

Or use the checker script:
```bash
python check_servers.py
```

---

## Frontend Configuration

Make sure your frontend `.env` or configuration points to:
- **Main API:** `http://localhost:5000`
- **Gamification API:** `http://localhost:8000`
- **ML API:** `http://localhost:8001` (if used)

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :5000
netstat -ano | findstr :8000
netstat -ano | findstr :8001

# Kill process (replace PID)
taskkill /F /PID <PID>
```

### MongoDB Not Running
```bash
# Check status
sc query MongoDB

# Start MongoDB
net start MongoDB
```

### Servers Won't Start
1. Check MongoDB is running
2. Check all dependencies are installed
3. Check ports are not in use
4. Check `.env` files have correct configuration

---

## Development Workflow

1. **Start MongoDB:** `net start MongoDB`
2. **Start Node.js Backend:** `cd backend && npm run dev`
3. **Start Gamification Server:** `python gamification_server.py`
4. **Start ML Server:** `cd aqi-forecasting && python run_api.py`
5. **Start Frontend:** `cd frontend && npm run dev`

All servers should now be running and ready for development!

