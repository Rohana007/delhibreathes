# 🚀 Quick Start Guide

## Step 1: Install Dependencies

```bash
cd delhi-breathes/aqi-forecasting
pip install -r requirements.txt
```

## Step 2: Train Models

```bash
python train_model.py
```

This will:
- ✅ Generate sample data automatically
- ✅ Preprocess and engineer features
- ✅ Train 3 models (Random Forest, XGBoost, LSTM)
- ✅ Select best model automatically
- ✅ Save models to `models/` directory

**⏱️ Expected time: 15-30 minutes**

## Step 3: Start API Server

```bash
python run_api.py
```

API will be available at: `http://localhost:8000`

## Step 4: Test API

### Quick Test (GET endpoints)

```bash
# Health check
curl http://localhost:8000/health

# 24-hour forecast
curl http://localhost:8000/predict/24h

# 72-hour forecast
curl http://localhost:8000/predict/72h
```

### Advanced Test (POST with custom data)

```bash
curl -X POST "http://localhost:8000/predict/24h" \
  -H "Content-Type: application/json" \
  -d '{
    "historical_data": [
      {
        "datetime": "2024-01-01T00:00:00",
        "AQI": 150,
        "PM2_5": 60,
        "PM10": 90,
        "Temperature": 25.0,
        "Humidity": 50.0,
        "Wind_Speed": 5.0
      }
    ]
  }'
```

## ✅ That's It!

Your AQI forecasting system is now ready to use!

For detailed documentation, see:
- `README.md` - Full documentation
- `SETUP.md` - Detailed setup guide

