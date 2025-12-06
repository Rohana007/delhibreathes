# AQI & Source Detection Improvements - Implementation Summary

## ✅ Completed Improvements

### 1. **Consolidated Air Quality Service** (`backend/src/services/airQualityService.js`)

#### Features Implemented:
- ✅ **AQI Validation**: Rejects AQI < 0 or > 800, handles NaN/null
- ✅ **Freshness Check**: Rejects readings older than 10 minutes
- ✅ **Multi-Source Fallback**: OpenWeather → WAQI → Nearest Sensor → Forecast Model
- ✅ **Smoothing**: Applies median filter when AQI fluctuates > 20 units in 1 minute
- ✅ **Confidence Scoring**: Calculates confidence (0-1) based on source quality and freshness
- ✅ **Response Format**: Returns `{ aqi, category, last_updated, source, confidence }`

#### Key Methods:
- `getCurrentAQI(lat, lon)` - Main entry point with all validations
- `isValidAQI(aqi)` - Validates AQI bounds
- `isFresh(timestamp)` - Checks if data is < 10 minutes old
- `applySmoothing(lat, lon, reading)` - Median filter for stability
- `categorizeAQI(aqi)` - Maps AQI to category (Good/Satisfactory/Moderate/Poor/Very Poor/Severe)

### 2. **Source Detection Service** (`backend/src/services/sourceDetectionService.js`)

#### Features Implemented:
- ✅ **Weighted Bayesian Scoring**: 
  - Traffic: 25% weight
  - Dust: 20% weight
  - Burning: 20% weight
  - Industrial: 15% weight
  - Stubble: 20% weight
- ✅ **Multi-Factor Analysis**:
  - Wind speed & direction
  - Traffic density (from markers)
  - Construction sites nearby
  - Fire hotspots (satellite data)
  - Seasonal weights
  - AQI rise rate
- ✅ **Stability Check**: Doesn't change source unless score difference > 0.15
- ✅ **Debouncing**: Updates max once every 30 seconds
- ✅ **Response Format**: Returns `{ primary_source, confidence, supporting_factors }`

#### Key Methods:
- `detectSource(lat, lon, aqiData)` - Main entry point
- `gatherFactors(lat, lon, aqiData)` - Collects all input factors
- `calculateTrafficScore(factors)` - Traffic source scoring
- `calculateDustScore(factors)` - Dust source scoring
- `calculateStubbleScore(factors)` - Stubble burning scoring
- `applyStability(newSource, newConfidence)` - Prevents rapid source changes

### 3. **Updated Controller** (`backend/src/controllers/aqiController.js`)

#### New Endpoints:
- ✅ `GET /api/aqi/current?lat=X&lon=Y` - Returns validated AQI with source detection
- ✅ Enhanced `GET /api/aqi/ncr` - Now validates all regions and adds freshness checks
- ✅ Enhanced `GET /api/aqi?lat=X&lon=Y` - Uses improved air quality service

#### Improvements:
- ✅ Validates AQI values (rejects < 0 or > 800)
- ✅ Adds `dataAgeMinutes` and `isStale` flags to regions
- ✅ Graceful error handling (never breaks UI)
- ✅ Comprehensive logging

### 4. **Frontend Updates** (`frontend/src/components/dashboard/AQICard.jsx`)

#### UI Enhancements:
- ✅ **Freshness Badge**: Shows "⚠ Data may be outdated" if > 10 minutes old
- ✅ **Source Chip**: Displays source name and confidence percentage
- ✅ **Fallback Indicator**: Shows "Showing nearest sensor value" when using fallback
- ✅ **Forecast Indicator**: Shows "Forecast model estimate" when using forecast

### 5. **Tests** (`backend/tests/airQualityService.test.js`)

#### Test Coverage:
- ✅ `test_aqi_freshness_rejection` - Rejects stale data
- ✅ `test_aqi_fallback_on_sensor_timeout` - Falls back gracefully
- ✅ `test_aqi_outlier_smoothing` - Applies median filter correctly
- ✅ `test_source_detection_weights` - Calculates scores correctly
- ✅ `test_source_detection_debounce` - Respects 30s debounce

## 📋 API Response Format

### `/api/aqi/current?lat=28.6139&lon=77.209`

```json
{
  "success": true,
  "data": {
    "aqi": 199,
    "category": "Moderate",
    "last_updated": "2025-12-04T12:15:59.637Z",
    "source": "OpenWeather",
    "confidence": 0.9,
    "source_detection": {
      "primary_source": "Traffic",
      "confidence": 0.78,
      "supporting_factors": {
        "wind_support": 0.4,
        "report_density": 0.2,
        "aqi_rise_rate": 0.3,
        "traffic_density": 0.8,
        "construction_sites": 0.2,
        "fire_hotspots": 0.1,
        "seasonal_weight": 1.0
      }
    },
    "pollutants": { ... },
    "sensor_id": "ow_28.61_77.21",
    "is_fallback": false,
    "is_forecast": false,
    "smoothed": false
  }
}
```

## 🔧 Configuration

### Freshness Threshold
- **10 minutes** - Data older than this is considered stale

### Smoothing Threshold
- **20 AQI units** - If fluctuation > 20 in 1 minute, apply median filter

### Source Detection Weights
- Traffic: 0.25
- Dust: 0.20
- Burning: 0.20
- Industrial: 0.15
- Stubble: 0.20

### Stability Threshold
- **0.15** - Source won't change unless score difference > 0.15

### Debounce Interval
- **30 seconds** - Source detection updates max once per 30s

## 🚀 Usage

### Backend
```javascript
// Get validated AQI
const aqiData = await airQualityService.getCurrentAQI(28.6139, 77.209);

// Get source detection
const source = await sourceDetectionService.detectSource(28.6139, 77.209, aqiData);
```

### Frontend
```jsx
// AQICard automatically shows:
// - Freshness badge if data > 10 minutes old
// - Source chip with confidence
// - Fallback/forecast indicators
```

## 📝 Notes

- **Caching**: Uses existing NodeCache (10s cache for `/aqi/current`, 30s for source detection)
- **Error Handling**: All services return graceful fallbacks, never throw errors that break UI
- **Logging**: Comprehensive logging for debugging (source quality, sensor ID, fallback usage)
- **Backward Compatibility**: Existing endpoints still work, new endpoint is additive

## ✅ Testing

Run tests:
```bash
cd backend
npm test -- airQualityService.test.js
```

## 🎯 Next Steps (Optional)

1. **Redis Integration**: Replace NodeCache with Redis for distributed caching
2. **Historical Smoothing**: Use longer history (last 10 readings) for better smoothing
3. **ML-Based Source Detection**: Train model on historical data for better accuracy
4. **Real-Time Traffic Data**: Integrate live traffic APIs for better traffic scoring

