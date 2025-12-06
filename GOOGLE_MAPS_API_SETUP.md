# Google Maps API Setup for Safe Route Finder

## ❌ Current Error: REQUEST_DENIED

The error "REQUEST_DENIED - The provided API key is invalid" means:
1. The API key is missing from `backend/.env`
2. The API key is invalid
3. The API key doesn't have the required APIs enabled

## ✅ Fix Steps

### Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Directions API** (Required)
   - **Maps JavaScript API** (For frontend)
   - **Places API** (For autocomplete)
   - **Geocoding API** (Optional, for better results)
   - **Roads API** (Optional, for traffic data)

### Step 2: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. (Optional) Restrict the API key to only the APIs you need

### Step 3: Add to Backend .env

Open `backend/.env` and add:

```env
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### Step 4: Add to Frontend .env.local

Open `frontend/.env.local` and add:

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### Step 5: Restart Backend

After adding the API key, restart your backend:

```bash
cd backend
npm run dev
```

## Verify It Works

1. Check backend logs - should see "Safe Route Service initialized successfully"
2. Test health endpoint: `GET http://localhost:5000/api/safe-route/health`
3. Try finding a route in the frontend

## Common Issues

### Issue: "REQUEST_DENIED"
- **Fix**: Enable "Directions API" in Google Cloud Console
- **Fix**: Check that API key is correct in `.env`

### Issue: "OVER_QUERY_LIMIT"
- **Fix**: Check your API quota in Google Cloud Console
- **Fix**: Enable billing if using free tier

### Issue: "ZERO_RESULTS"
- **Fix**: Check that source and destination coordinates are valid
- **Fix**: Try different locations

## Required APIs

Minimum required:
- ✅ Directions API
- ✅ Maps JavaScript API
- ✅ Places API

Optional (for better features):
- Geocoding API
- Roads API
- Distance Matrix API

