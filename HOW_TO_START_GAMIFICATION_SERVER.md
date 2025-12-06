# How to Start the Gamification Server

The alerts feature requires the FastAPI Gamification Engine to be running.

## Quick Start

### Windows
```bash
python gamification_server.py
```
Or double-click: `start_gamification_server.bat`

### Linux/Mac
```bash
python3 gamification_server.py
```
Or run: `bash start_gamification_server.sh`

## Prerequisites

1. **Python 3.8+** installed
2. **Dependencies installed**:
   ```bash
   pip install -r requirements_gamification.txt
   ```
3. **MongoDB** running and accessible
4. **Environment variables** in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/delhi_breathes
   JWT_SECRET=your_jwt_secret_here
   GAMIFICATION_PORT=8000
   ```

## Verify Server is Running

1. Check console output - should show:
   ```
   GAMIFICATION ENGINE READY
   Server running on: http://localhost:8000
   ```

2. Test in browser:
   - Open: `http://localhost:8000/docs`
   - Should see FastAPI Swagger documentation

3. Test health endpoint:
   - Open: `http://localhost:8000/health`
   - Should return: `{"status": "healthy", "database": "connected"}`

## Troubleshooting

### Port 8000 Already in Use
- Change port in `.env`: `GAMIFICATION_PORT=8001`
- Update frontend `.env`: `VITE_FASTAPI_URL=http://localhost:8001`

### MongoDB Connection Failed
- Check MongoDB is running: `mongosh` or `mongo`
- Verify `MONGODB_URI` in `.env` is correct

### Module Not Found Errors
- Install dependencies: `pip install -r requirements_gamification.txt`
- Check Python path includes project root

## Running Both Servers

You need **TWO servers** running:

1. **Node.js Backend** (Port 5000):
   ```bash
   cd backend
   npm run dev
   ```

2. **FastAPI Gamification** (Port 8000):
   ```bash
   python gamification_server.py
   ```

Both must be running for the alerts feature to work!

