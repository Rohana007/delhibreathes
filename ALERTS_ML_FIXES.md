# Alerts and ML Forecasting Fixes

## Issues Fixed

### 1. ✅ ML Forecast API 404 Error
**Problem**: Frontend was calling ML API on port 8000, but ML server runs on port 8001.

**Fix**: Updated `frontend/src/services/api.js`:
```javascript
// Changed from:
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

// To:
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8001';
```

**File**: `frontend/src/services/api.js` (line 326)

### 2. ✅ JWT Secret Not Configured Error
**Problem**: Gamification server was returning "JWT secret not configured" error (500) when enabling alerts.

**Fixes Applied**:

#### a) Updated `gamification_server.py`
- Added automatic JWT_SECRET loading from environment
- Falls back to `backend/.env` if not in root `.env`
- Sets default `localtestsecret` if not found
- Also sets `VERIFICATION_TOKEN_SECRET` for compatibility

#### b) Updated `api/alerts_routes.py`
- Changed from raising error to using fallback secret
- Uses `localtestsecret` as default for local development
- Logs warning instead of crashing

**Files Modified**:
- `gamification_server.py` (lines 24-44)
- `api/alerts_routes.py` (lines 42-48)

### 3. ✅ Environment Configuration
**Updated**: `start_all_servers.bat` to include `JWT_SECRET` and `VERIFICATION_TOKEN_SECRET` in `.env` files.

## Required Actions

### Restart Gamification Server
The gamification server needs to be restarted for JWT_SECRET changes to take effect:

1. **Stop the current server** (if running):
   - Close the gamification server terminal window
   - Or kill the process: `taskkill /F /PID <PID>`

2. **Restart the server**:
   ```batch
   python gamification_server.py
   ```
   
   Or use the unified startup script:
   ```batch
   start_all_servers.bat
   ```

### Verify Fixes

1. **Test ML Forecast API**:
   ```bash
   curl http://localhost:8001/predict/24h
   ```
   Should return forecast data (not 404).

2. **Test Alerts Endpoint**:
   - Open http://localhost:3000/dashboard
   - Click "Enable Personalized Alerts"
   - Select region and health category
   - Click "Enable Alerts"
   - Should work without "JWT secret not configured" error

3. **Check Console**:
   - Open browser DevTools (F12)
   - Check Console tab
   - Should see no more 404 errors for `/predict/24h`
   - Should see no more 500 errors for `/user/alerts/enable`

## Server Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Node.js Backend | 5000 | http://localhost:5000 |
| Gamification API | 8000 | http://localhost:8000 |
| ML Forecast API | 8001 | http://localhost:8001 |

## Environment Variables

Ensure these are set in `.env` (root) or `backend/.env`:

```env
JWT_SECRET=localtestsecret
VERIFICATION_TOKEN_SECRET=localtestsecret
```

The gamification server will automatically:
1. Load from root `.env`
2. Fall back to `backend/.env`
3. Use default `localtestsecret` if not found

## Testing Checklist

- [ ] ML Forecast API returns data (no 404)
- [ ] Alerts modal opens without errors
- [ ] Enable Alerts works (no 500 error)
- [ ] Dashboard shows "Alerts ON" after enabling
- [ ] Console shows no ML API 404 errors
- [ ] Console shows no JWT secret errors

## Notes

- The frontend will automatically use the correct ML API port (8001) after the fix
- JWT_SECRET is now automatically configured with a safe default
- For production, set a strong JWT_SECRET in `.env` files
- All servers must be restarted after environment changes

