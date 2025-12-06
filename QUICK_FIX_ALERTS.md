# Quick Fix: Personalized Alerts Not Working

## Problem
The alerts feature requires the FastAPI Gamification Server to be running, but it's not starting.

## Solution Steps

### Step 1: Check MongoDB is Running

The server needs MongoDB to start. Check if MongoDB is running:

**Windows:**
```bash
# Check if MongoDB service is running
sc query MongoDB

# Or check if mongod process exists
tasklist | findstr mongod
```

**If MongoDB is NOT running:**
- Start MongoDB service: `net start MongoDB`
- Or start manually: `mongod --dbpath "C:\data\db"`

### Step 2: Start the Gamification Server

Open a **NEW terminal window** and run:

```bash
cd "d:\New folder\delhi-breathes - Copy"
python gamification_server.py
```

**You should see:**
```
[STARTUP] Starting Gamification Engine...
[OK] MongoDB connected successfully!
[OK] Seeding complete!
GAMIFICATION ENGINE READY
Server running on: http://localhost:8001
```

**If you see MongoDB connection error:**
- Make sure MongoDB is installed and running
- Check your `.env` file has correct `MONGODB_URI`
- Default: `mongodb://localhost:27017/delhi_breathes`

### Step 3: Verify Server is Running

In another terminal, test:
```bash
python -c "import requests; r = requests.get('http://localhost:8001/'); print(r.json())"
```

Should return:
```json
{
  "name": "DelhiBreathes Gamification Engine",
  "status": "running",
  "endpoints": {
    "alerts_status": "/user/alerts/status",
    "alerts_enable": "/user/alerts/enable"
  }
}
```

### Step 4: Test Alerts in Browser

1. Refresh your browser (F5)
2. Go to Dashboard
3. Find "Personalized Alerts" card
4. Click "Enable"
5. Select region and health category
6. Click "Enable Alerts"

## Common Issues

### Issue: "404 Not Found"
**Solution:** Server is not running. Follow Step 2.

### Issue: "Connection refused"
**Solution:** Server crashed or MongoDB not running. Check Step 1.

### Issue: Server starts but times out
**Solution:** MongoDB connection is slow. Check MongoDB logs.

## Keep Server Running

**IMPORTANT:** Keep the terminal window with `python gamification_server.py` open while using the app!

To run in background (Windows):
```bash
start /B python gamification_server.py
```

## Both Servers Must Run

You need **TWO servers** running:

1. **Node.js Backend** (Port 5000):
   ```bash
   cd backend
   npm run dev
   ```

2. **FastAPI Gamification** (Port 8001):
   ```bash
   python gamification_server.py
   ```

Both must be running for alerts to work!

