# Complete Fix: Personalized Alerts Feature

## ✅ All Fixes Applied

### 1. Backend Configuration ✅
- **CORS Updated**: Now allows `http://localhost:3000` and `http://localhost:3001`
- **Port Configuration**: Server runs on port **8000** (default)
- **Routes Registered**: Alerts routes are included in `gamification_server.py`

### 2. Frontend Configuration ✅
- **API Base URL**: Changed from port 8001 to **8000**
- **Error Handling**: Improved to catch `ERR_CONNECTION_REFUSED`
- **User-Friendly Messages**: Clear error messages when server is offline

### 3. Files Updated ✅

**Backend:**
- `gamification_server.py` - CORS and port configuration
- `api/alerts_routes.py` - Routes already exist and are correct
- `start_gamification_server.bat` - Updated to show port 8000

**Frontend:**
- `frontend/src/components/alerts/PersonalizedAlertsCard.jsx` - Port 8000, better error handling
- `frontend/src/components/alerts/AlertSettingsModal.jsx` - Port 8000, improved errors

## 🚀 How to Start the Server

### Step 1: Make sure MongoDB is running
```bash
# Check MongoDB
sc query MongoDB

# If not running, start it:
net start MongoDB
```

### Step 2: Start the Gamification Server
```bash
# Option 1: Use the batch file
start_gamification_server.bat

# Option 2: Run directly
python gamification_server.py
```

**Expected Output:**
```
[STARTUP] Starting Gamification Engine...
[OK] MongoDB connected successfully!
[OK] Seeding complete!
GAMIFICATION ENGINE READY
Server running on: http://localhost:8000
```

### Step 3: Verify Server is Running
```bash
python -c "import requests; r = requests.get('http://localhost:8000/'); print(r.json())"
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

## 🔧 Troubleshooting

### Issue: Port 8000 Already in Use
**Solution:**
1. Find what's using port 8000:
   ```bash
   netstat -ano | findstr :8000
   ```
2. Kill the process:
   ```bash
   taskkill /F /PID <process_id>
   ```
3. Restart the gamification server

### Issue: ERR_CONNECTION_REFUSED
**Causes:**
- Server is not running
- MongoDB is not running (server won't start)
- Wrong port in frontend

**Solution:**
1. Check server is running: `netstat -ano | findstr :8000`
2. Check MongoDB: `sc query MongoDB`
3. Verify frontend uses port 8000 (already fixed)

### Issue: 404 Not Found
**Causes:**
- Routes not registered
- Wrong endpoint path

**Solution:**
- Routes are already registered in `gamification_server.py`
- Endpoints: `/user/alerts/status` and `/user/alerts/enable`

## ✅ Success Checklist

After starting the server:
- [ ] Server shows "GAMIFICATION ENGINE READY"
- [ ] `http://localhost:8000/` returns gamification engine info
- [ ] `http://localhost:8000/docs` shows API documentation
- [ ] Frontend can fetch `/user/alerts/status` (with JWT token)
- [ ] Frontend can POST to `/user/alerts/enable` (with JWT token)
- [ ] Modal closes after enabling alerts
- [ ] Dashboard shows "Alerts ON" after enabling

## 📝 API Endpoints

### GET /user/alerts/status
**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "alerts_enabled": true,
  "region": "Delhi",
  "health_category": "pregnant"
}
```

### POST /user/alerts/enable
**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "region": "Delhi",
  "health_category": "pregnant"
}
```

**Response:**
```json
{
  "success": true,
  "alerts_enabled": true,
  "region": "Delhi",
  "health_category": "pregnant"
}
```

## 🎯 Next Steps

1. **Start MongoDB** (if not running)
2. **Start Gamification Server** on port 8000
3. **Refresh Browser** and test alerts feature
4. **Check Console** for any remaining errors

All code fixes are complete. The server just needs to be running!

