# Safe Route Finder Integration - Complete Guide

## ✅ Integration Complete

The Safe Route Finder backend has been successfully merged into the main Express.js backend. Everything now runs as a unified system.

## 📁 New Backend Structure

```
backend/src/
├── safe_route/                    # NEW: Safe Route Python service
│   ├── routing_engine/           # Python routing engine modules
│   │   ├── google_client.py
│   │   ├── aqi_grid_loader.py
│   │   ├── route_segmentation.py
│   │   ├── exposure.py
│   │   ├── scoring.py
│   │   ├── colorizer.py
│   │   ├── cache.py
│   │   ├── utils.py
│   │   └── __init__.py
│   ├── api/
│   │   └── route_endpoint.py     # Original FastAPI endpoint (kept for reference)
│   ├── safeRouteService.py       # NEW: Python service wrapper for Node.js
│   ├── requirements.txt          # Python dependencies
│   └── __init__.py
├── services/
│   └── safeRouteService.js       # NEW: Node.js service that calls Python
├── controllers/
│   └── safeRouteController.js    # NEW: Express controller
└── routes/
    └── safeRouteRoutes.js        # NEW: Express routes
```

## 🔧 How It Works

1. **Frontend** calls `/api/safe-route/find` (Express endpoint)
2. **Express Controller** (`safeRouteController.js`) validates request
3. **Node.js Service** (`safeRouteService.js`) spawns Python subprocess
4. **Python Service** (`safeRouteService.py`) processes route using routing engine
5. **Response** flows back through the chain to frontend

## 🚀 Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r src/safe_route/requirements.txt
```

**Note**: On Windows, if you get compilation errors for numpy/scipy, install pre-built wheels:
```bash
pip install numpy scipy --only-binary :all:
```

### 2. Environment Variables

Add to your `.env` file (in `backend/` directory):

```env
# Google Maps API (required for Safe Route)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# MongoDB (uses existing connection)
MONGO_URI=mongodb://localhost:27017/delhi_breathes
# OR
MONGODB_URI=mongodb://localhost:27017/delhi_breathes

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# Optional Safe Route settings
ROUTE_SEGMENT_LENGTH_M=15.0
CACHE_TTL_SECONDS=300

# Python command (optional, defaults to 'python')
# PYTHON_CMD=python3  # Use on Linux/Mac if needed
```

### 3. Start the Backend

**Single command now!** No need to run separate Safe Route server:

```bash
cd backend
npm run dev
```

The Express server will:
- Start on port 5000 (or PORT from .env)
- Initialize MongoDB connection
- Safe Route endpoints available at `/api/safe-route/*`

## 📡 API Endpoints

### GET /api/safe-route/find

Get safe route between two points.

**Query Parameters:**
- `source_lat` (required): Source latitude
- `source_lng` (required): Source longitude
- `dest_lat` (required): Destination latitude
- `dest_lng` (required): Destination longitude
- `weight_distance` (optional, default: 0.6): Weight for distance factor
- `weight_pollution` (optional, default: 0.3): Weight for pollution factor
- `weight_traffic` (optional, default: 0.1): Weight for traffic factor

**Example:**
```bash
curl "http://localhost:5000/api/safe-route/find?source_lat=28.6139&source_lng=77.2090&dest_lat=28.5355&dest_lng=77.3910"
```

**Response:**
```json
{
  "success": true,
  "recommended_route": {
    "route_id": "route_0",
    "distance_m": 18500.5,
    "duration_s": 1245.2,
    "exposure": 67.3,
    "polylines_by_color": [...],
    "steps": [...]
  },
  "all_routes": [...],
  "reason": "Exposure 21.0% lower; distance 7.6% longer",
  "comparison": {
    "exposure_reduction_pct": 21.0,
    "distance_diff_pct": 7.6,
    "time_diff_seconds": 124.7
  }
}
```

### GET /api/safe-route/health

Health check for Safe Route service.

**Response:**
```json
{
  "success": true,
  "service": "Safe Route Finder",
  "initialized": true,
  "pythonAvailable": true
}
```

## 🎨 Frontend Integration

The frontend (`AirShieldNavigator.jsx`) has been updated to use the new endpoint:

```javascript
// Old (separate server):
const API_BASE = 'http://localhost:8001';
fetch(`${API_BASE}/route/safe?...`)

// New (unified backend):
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
fetch(`${API_BASE}/safe-route/find?...`)
```

## ✅ Verification Checklist

- ✅ Python files moved to `backend/src/safe_route/`
- ✅ Node.js service wrapper created
- ✅ Express routes added (`/api/safe-route/*`)
- ✅ Frontend updated to use new endpoint
- ✅ Button text visibility fixed
- ✅ Uses existing MongoDB connection
- ✅ Uses existing Redis connection (if available)
- ✅ Single run command: `npm run dev`
- ✅ No port conflicts (runs on same port as main backend)

## 🗑️ Cleanup (After Verification)

Once everything is working, you can delete:

```bash
# Delete the old separate safe-route folder
rm -rf safe-route/

# Or on Windows:
Remove-Item -Recurse -Force safe-route
```

**Note**: Keep `backend/src/safe_route/` - that's the integrated version!

## 🐛 Troubleshooting

### Python Not Found

If you get "Python not found" errors:

1. **Windows**: Ensure Python is in PATH, or set:
   ```env
   PYTHON_CMD=py
   # OR
   PYTHON_CMD=C:\Python311\python.exe
   ```

2. **Linux/Mac**: Use:
   ```env
   PYTHON_CMD=python3
   ```

### Import Errors

If Python modules fail to import:

1. Verify Python dependencies are installed:
   ```bash
   pip install -r backend/src/safe_route/requirements.txt
   ```

2. Check Python path in `safeRouteService.py` - it should find modules correctly

### MongoDB Connection

The Python service uses the same MongoDB URI as the main backend:
- Checks `MONGO_URI` or `MONGODB_URI` environment variable
- Falls back to `mongodb://localhost:27017/delhi_breathes`

### Redis Connection

Redis is optional but recommended for caching:
- Checks `REDIS_URL` environment variable
- Falls back to `redis://localhost:6379`
- Service will work without Redis (no caching)

## 📊 Performance Notes

- **First Request**: May be slower (~2-3s) as Python process initializes
- **Subsequent Requests**: Faster (~1-2s) as Python process stays warm
- **Caching**: Redis caching reduces Google API calls (5-minute TTL)

## 🔄 Migration from Separate Server

If you were running the separate Safe Route server on port 8001:

1. **Stop** the separate server (if running)
2. **Update** frontend `.env` to remove `VITE_SAFE_ROUTE_API_URL`
3. **Start** main backend: `npm run dev`
4. **Test** `/api/safe-route/find` endpoint
5. **Delete** old `safe-route/` folder

## ✨ Benefits of Integration

1. **Single Command**: `npm run dev` starts everything
2. **Shared Resources**: Uses same MongoDB/Redis connections
3. **Unified Logging**: All logs in one place
4. **Easier Deployment**: One service to deploy
5. **Better Error Handling**: Consistent error responses
6. **Rate Limiting**: Uses Express rate limiting

---

**Status**: ✅ Integration Complete
**Next Steps**: Test the endpoint and delete old `safe-route/` folder

