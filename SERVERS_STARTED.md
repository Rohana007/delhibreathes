# FastAPI and ML Servers Setup Complete ✅

## What Was Done

1. ✅ **Updated ML Server Port** - Changed from 8000 to 8001 to avoid conflict with Gamification server
2. ✅ **Created Startup Script** - `start_all_servers.bat` to start both servers easily
3. ✅ **Created Server Checker** - `check_servers.py` to verify servers are running
4. ✅ **Started Servers in Background** - Both servers have been initiated

## Server Configuration

### Node.js Backend (Main API)
- **Port:** 5000
- **File:** `backend/src/server.js`
- **Purpose:** Main backend API, authentication, reports

### Gamification Server (FastAPI)
- **Port:** 8000
- **File:** `gamification_server.py`
- **Purpose:** Gamification engine, badges, rewards, alerts
- **Status:** Starting (requires MongoDB)

### ML/AQI Forecasting Server (FastAPI)
- **Port:** 8001 (changed from 8000)
- **File:** `aqi-forecasting/run_api.py`
- **Purpose:** AQI predictions (24h, 72h forecasts)
- **Status:** Starting

## ⚠️ Important: MongoDB Required

Both servers require **MongoDB to be running**. If servers fail to start:

1. **Start MongoDB:**
   ```bash
   net start MongoDB
   ```

2. **Or check if MongoDB is running:**
   ```bash
   sc query MongoDB
   ```

## How to Start Servers

### Option 1: Use Batch Script (Recommended)
```bash
start_all_servers.bat
```

This opens two separate windows, one for each server.

### Option 2: Manual Start

**Terminal 1 - Gamification Server:**
```bash
python gamification_server.py
```

**Terminal 2 - ML Server:**
```bash
cd aqi-forecasting
python run_api.py
```

## Verify Servers Are Running

Run the checker script:
```bash
python check_servers.py
```

Or test manually:
```bash
# Test Gamification Server
curl http://localhost:8000/

# Test ML Server  
curl http://localhost:8001/
```

## Expected Output

### Gamification Server (8000)
```json
{
  "name": "DelhiBreathes Gamification Engine",
  "version": "1.0.0",
  "status": "running"
}
```

### ML Server (8001)
Should return API information and be accessible at http://localhost:8001/docs

## Troubleshooting

### Servers Won't Start
1. **Check MongoDB:** `sc query MongoDB`
2. **Start MongoDB:** `net start MongoDB` (requires admin)
3. **Check Ports:** `netstat -ano | findstr ":8000 :8001"`
4. **Check Dependencies:** Ensure all Python packages are installed

### Port Already in Use
```bash
# Find process
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /F /PID <PID>
```

## Next Steps

1. Ensure MongoDB is running
2. Start both servers using `start_all_servers.bat`
3. Verify with `python check_servers.py`
4. Access API docs:
   - Gamification: http://localhost:8000/docs
   - ML Server: http://localhost:8001/docs

---

**Note:** Servers started in background may have stopped if MongoDB wasn't available. Use the batch script to start them properly.

