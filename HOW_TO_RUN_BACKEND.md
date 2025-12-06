# How to Run the Backend

## ❌ DO NOT USE UVICORN

This is a **Node.js/Express** backend, NOT a FastAPI backend. The Python Safe Route service runs as a **subprocess** from Node.js.

## ✅ Correct Way to Run Backend

### Option 1: Using npm (Recommended)
```bash
cd backend
npm run dev
```

### Option 2: Using node directly
```bash
cd backend
node src/server.js
```

### Option 3: Using npm start (Production)
```bash
cd backend
npm start
```

## How It Works

1. **Node.js/Express server** starts on port 5000 (default)
2. When `/api/safe-route/find` is called:
   - Express controller receives the request
   - Node.js service spawns a Python subprocess
   - Python script (`safeRouteService.py`) processes the route
   - Result is returned to Express
   - Express sends response to frontend

## No Separate Python Server Needed

- ❌ **DO NOT** run `uvicorn` or any FastAPI server
- ❌ **DO NOT** run Python script as standalone server
- ✅ Python runs as subprocess when needed
- ✅ Everything runs through one Node.js server

## Environment Setup

Make sure you have:

1. **Node.js** installed (v18+)
2. **Python** installed (v3.8+)
3. **Python dependencies** installed:
   ```bash
   pip install -r backend/src/safe_route/requirements.txt
   ```
4. **Environment variables** in `backend/.env`:
   ```
   GOOGLE_MAPS_API_KEY=your_key_here
   MONGO_URI=mongodb://localhost:27017/delhi_breathes
   REDIS_URL=redis://localhost:6379
   ```

## Verify It's Working

1. Start backend: `cd backend && npm run dev`
2. Check health: `GET http://localhost:5000/api/safe-route/health`
3. Test route: `GET http://localhost:5000/api/safe-route/find?source_lat=28.6139&source_lng=77.2090&dest_lat=28.5355&dest_lng=77.3910`

## Troubleshooting

If you see errors:
- Check that `GOOGLE_MAPS_API_KEY` is set in `backend/.env`
- Check that Python dependencies are installed
- Check backend logs for detailed error messages

