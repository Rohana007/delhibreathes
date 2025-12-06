# How to Start FastAPI and ML Servers

## Quick Start

### Option 1: Use the Batch Script (Easiest)
```bash
start_all_servers.bat
```

This will start both servers in separate windows.

---

### Option 2: Manual Start

#### 1. Start Gamification Server (Port 8000)
```bash
python gamification_server.py
```

#### 2. Start ML/AQI Forecasting Server (Port 8001)
```bash
cd aqi-forecasting
python run_api.py
```

---

## Server Details

### Gamification Server
- **Port:** 8000
- **File:** `gamification_server.py`
- **Purpose:** Gamification engine, badges, rewards, alerts
- **URL:** http://localhost:8000
- **Docs:** http://localhost:8000/docs

### ML/AQI Forecasting Server
- **Port:** 8001
- **File:** `aqi-forecasting/run_api.py`
- **Purpose:** AQI predictions (24h, 72h forecasts)
- **URL:** http://localhost:8001
- **Docs:** http://localhost:8001/docs

---

## Prerequisites

### MongoDB
Both servers require MongoDB to be running:

**Windows:**
```bash
net start MongoDB
```

**Check Status:**
```bash
sc query MongoDB
```

### Python Dependencies
```bash
# Install gamification dependencies
pip install -r requirements_gamification.txt

# Install ML dependencies
cd aqi-forecasting
pip install -r requirements.txt
```

---

## Verify Servers Are Running

### Test Gamification Server:
```bash
curl http://localhost:8000/
```

Should return:
```json
{
  "name": "DelhiBreathes Gamification Engine",
  "version": "1.0.0",
  "status": "running"
}
```

### Test ML Server:
```bash
curl http://localhost:8001/
```

Should return API information.

---

## Troubleshooting

### Port Already in Use
If port 8000 or 8001 is already in use:

**Windows:**
```bash
# Find process using port
netstat -ano | findstr :8000

# Kill process (replace PID with actual process ID)
taskkill /F /PID <PID>
```

### MongoDB Not Running
- Start MongoDB service: `net start MongoDB`
- Or use MongoDB Atlas (cloud) and update `MONGODB_URI` in `.env`

### Server Won't Start
1. Check MongoDB is running
2. Check Python dependencies are installed
3. Check port is not in use
4. Check `.env` file has correct `MONGODB_URI`

---

## Background Process Management

Servers started in background will continue running. To stop them:

**Windows:**
```bash
# Find Python processes
tasklist | findstr python

# Kill all Python processes (careful!)
taskkill /F /IM python.exe
```

---

## Environment Variables

Create `.env` file in project root:
```
MONGODB_URI=mongodb://localhost:27017/delhi_breathes
JWT_SECRET=your_jwt_secret_here
ML_PORT=8001
GAMIFICATION_PORT=8000
```

