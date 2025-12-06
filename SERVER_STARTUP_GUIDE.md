# Delhi Breathes - Unified Server Startup Guide

## 🚀 Quick Start

### Windows
```batch
start_all_servers.bat
```

### Linux/Mac
```bash
chmod +x run_all_servers.sh
./run_all_servers.sh
```

## 📋 What the Scripts Do

The unified startup scripts automatically:

1. **Check Prerequisites**
   - Python 3.x
   - Node.js (v18+)
   - npm

2. **Clear Port Conflicts**
   - Automatically kills processes on ports 8000, 8001, 5000, 3000

3. **Create Environment Files**
   - `.env` (root)
   - `backend/.env`
   - `aqi-forecasting/.env`

4. **Install Dependencies**
   - Frontend: `npm install` (if `node_modules` missing)
   - Backend: `npm install` (if `node_modules` missing)

5. **Start All Servers**
   - Gamification Server (Port 8000)
   - ML/AQI Forecasting Server (Port 8001)
   - Node.js Backend (Port 5000)
   - Frontend (Port 3000)

6. **Verify Servers**
   - Tests health endpoints
   - Reports status

## 🌐 Server URLs

After startup, access:

- **Frontend**: http://localhost:3000
- **Node.js Backend**: http://localhost:5000
- **Gamification API**: http://localhost:8000
- **ML/AQI Forecast API**: http://localhost:8001

## 🔍 Health Check Endpoints

Test server status:

```bash
# Gamification Server
curl http://localhost:8000/health

# ML Server
curl http://localhost:8001/health

# Node.js Backend
curl http://localhost:5000/api/health

# Frontend
curl http://localhost:3000
```

## 📝 Manual Server Startup

If you prefer to start servers manually:

### 1. Gamification Server (Port 8000)
```bash
python gamification_server.py
```

### 2. ML/AQI Forecasting Server (Port 8001)
```bash
cd aqi-forecasting
python run_api.py
```

### 3. Node.js Backend (Port 5000)
```bash
cd backend
npm run dev
```

### 4. Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

## ⚙️ Environment Variables

### Root `.env`
```env
MONGODB_URI=mongodb://localhost:27017/delhibreathes
GAMIFICATION_PORT=8000
ML_PORT=8001
NODE_PORT=5000
FRONTEND_PORT=3000
JWT_SECRET=localtestsecret
CORS_ORIGINS=*
```

### `backend/.env`
```env
MONGO_URI=mongodb://localhost:27017/delhibreathes
PORT=5000
JWT_SECRET=localtestsecret
```

### `aqi-forecasting/.env`
```env
ML_PORT=8001
ML_HOST=0.0.0.0
```

## 🔧 Troubleshooting

### Port Already in Use

The startup script automatically kills processes on required ports. If issues persist:

**Windows:**
```batch
netstat -ano | findstr ":8000"
taskkill /F /PID <PID>
```

**Linux/Mac:**
```bash
lsof -ti:8000 | xargs kill -9
```

### MongoDB Not Running

Ensure MongoDB is running before starting servers:

**Windows:**
```batch
net start MongoDB
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
# or
mongod
```

### Server Not Responding

1. Check server logs in the terminal windows
2. Verify MongoDB is running
3. Check firewall settings
4. Ensure all dependencies are installed

### Verify All Servers

Run the verification script:

```bash
python verify_servers.py
```

## 📊 Server Status

| Server | Port | Health Endpoint | Status |
|--------|------|-----------------|--------|
| Frontend | 3000 | http://localhost:3000 | ✅ Running |
| Node.js Backend | 5000 | http://localhost:5000/api/health | ✅ Running |
| Gamification | 8000 | http://localhost:8000/health | ✅ Running |
| ML/AQI Forecast | 8001 | http://localhost:8001/health | ✅ Running |

## 🎯 Next Steps

1. Open http://localhost:3000 in your browser
2. Test the application features
3. Check API documentation:
   - Gamification: http://localhost:8000/docs
   - ML Forecast: http://localhost:8001/docs

## 📚 Additional Resources

- **Backend API Docs**: See `backend/API_DOCUMENTATION.md`
- **ML Setup**: See `aqi-forecasting/SETUP.md`
- **MongoDB Setup**: See `MONGODB_LOCAL_SETUP.md`

---

**Note**: Keep all server terminal windows open while using the application. Closing them will stop the servers.

