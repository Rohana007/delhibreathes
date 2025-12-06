"""
FastAPI server for AQI forecasting
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

from scripts.forecast import AQIForecaster

app = FastAPI(
    title="AQI Forecasting API",
    description="API for 24-hour and 72-hour AQI predictions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize forecaster
forecaster = None

@app.on_event("startup")
async def startup_event():
    """Initialize forecaster on startup"""
    global forecaster
    try:
        # Get models directory path - api/main.py is in api/, so go up one level to project root
        api_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(api_dir)
        model_path = os.path.join(project_root, 'models')
        forecaster = AQIForecaster(model_path=model_path)
        print("✅ Forecaster initialized")
    except Exception as e:
        print(f"❌ Error initializing forecaster: {e}")
        print("⚠️  Make sure you have trained models first: python train_model.py")
        # Don't raise - allow API to start but endpoints will return 503

class HistoricalDataPoint(BaseModel):
    """Single historical data point"""
    datetime: str
    AQI: float
    PM2_5: Optional[float] = None
    PM10: Optional[float] = None
    NO2: Optional[float] = None
    SO2: Optional[float] = None
    CO: Optional[float] = None
    O3: Optional[float] = None
    Temperature: Optional[float] = None
    Humidity: Optional[float] = None
    Wind_Speed: Optional[float] = None
    Wind_Direction: Optional[float] = None

class ForecastRequest(BaseModel):
    """Request body for forecast"""
    historical_data: List[HistoricalDataPoint]
    future_weather: Optional[List[dict]] = None

class ForecastResponse(BaseModel):
    """Forecast response"""
    forecasts: List[dict]
    model_used: str
    forecast_hours: int
    generated_at: str

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AQI Forecasting API",
        "version": "1.0.0",
        "endpoints": {
            "/predict/6h": "6-hour AQI forecast",
            "/predict/24h": "24-hour AQI forecast",
            "/predict/72h": "72-hour AQI forecast",
            "/health": "Health check"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if forecaster is None:
        raise HTTPException(status_code=503, detail="Forecaster not initialized")
    
    return {
        "status": "healthy",
        "model": forecaster.model_name,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/predict/24h", response_model=ForecastResponse)
async def predict_24h_get():
    """
    Generate 24-hour AQI forecast (GET endpoint - uses latest data from file)
    
    Returns:
        ForecastResponse with 24-hour predictions
    """
    if forecaster is None:
        raise HTTPException(status_code=503, detail="Forecaster not initialized")
    
    try:
        # Load latest data from file
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'aqi_data.csv')
        if not os.path.exists(data_path):
            raise HTTPException(status_code=404, detail="Data file not found. Please train models first.")
        
        historical_df = pd.read_csv(data_path)
        historical_df['datetime'] = pd.to_datetime(historical_df['datetime'])
        historical_df = historical_df.sort_values('datetime').reset_index(drop=True)
        
        # Use last 48 hours as historical data
        historical = historical_df.tail(48).copy()
        
        # Generate forecast
        forecast_df = forecaster.forecast_24h(historical)
        
        # Convert to response format
        forecasts = []
        for _, row in forecast_df.iterrows():
            forecasts.append({
                'datetime': row['datetime'].isoformat(),
                'AQI': float(row['AQI']),
                'hour_ahead': int(row['hour_ahead'])
            })
        
        return ForecastResponse(
            forecasts=forecasts,
            model_used=forecaster.model_name,
            forecast_hours=24,
            generated_at=datetime.now().isoformat()
        )
    
    except Exception as e:
        # Debug logging to help diagnose errors in production (especially on Windows)
        try:
            import traceback
            from pathlib import Path

            log_path = Path(__file__).resolve().parent / "predict_24h_error.log"
            with log_path.open("a", encoding="utf-8") as f:
                f.write(f"\n=== {datetime.now().isoformat()} ===\n")
                f.write(f"Exception type: {type(e).__name__}\n")
                f.write(f"Exception repr: {repr(e)}\n")
                traceback.print_exc(file=f)
        except Exception:
            # Swallow any logging error to avoid masking the original issue
            pass

        raise HTTPException(
            status_code=500,
            detail=f"Error generating forecast: {type(e).__name__}: {str(e)}",
        )

@app.get("/predict/6h")
async def predict_6h_get():
    """
    Generate 6-hour AQI forecast (GET endpoint - uses latest data from file)
    
    Returns:
        JSON with 6-hour predictions in 'forecast' field
    """
    if forecaster is None:
        raise HTTPException(status_code=503, detail="Forecaster not initialized")
    
    try:
        # Load latest data from file
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'aqi_data.csv')
        if not os.path.exists(data_path):
            raise HTTPException(status_code=404, detail="Data file not found. Please train models first.")
        
        historical_df = pd.read_csv(data_path)
        historical_df['datetime'] = pd.to_datetime(historical_df['datetime'])
        historical_df = historical_df.sort_values('datetime').reset_index(drop=True)
        
        # Use last 48 hours as historical data
        historical = historical_df.tail(48).copy()
        
        # Generate forecast
        forecast_df = forecaster.forecast_6h(historical)
        
        # Convert to response format
        forecasts = []
        for _, row in forecast_df.iterrows():
            forecasts.append({
                'datetime': row['datetime'].isoformat(),
                'AQI': float(row['AQI']),
                'hour_ahead': int(row['hour_ahead'])
            })
        
        # Return format compatible with frontend
        return {
            "forecast": forecasts,
            "forecasts": forecasts,  # Keep for backward compatibility
            "model_used": forecaster.model_name,
            "forecast_hours": 6,
            "generated_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

@app.post("/predict/24h", response_model=ForecastResponse)
async def predict_24h_post(request: ForecastRequest):
    """
    Generate 24-hour AQI forecast
    
    Args:
        request: ForecastRequest with historical data
    
    Returns:
        ForecastResponse with 24-hour predictions
    """
    if forecaster is None:
        raise HTTPException(status_code=503, detail="Forecaster not initialized")
    
    try:
        # Convert request to DataFrame
        historical_list = []
        for point in request.historical_data:
            historical_list.append({
                'datetime': point.datetime,
                'AQI': point.AQI,
                'PM2.5': point.PM2_5 if point.PM2_5 is not None else point.AQI * 0.4,
                'PM10': point.PM10 if point.PM10 is not None else point.AQI * 0.6,
                'NO2': point.NO2 if point.NO2 is not None else point.AQI * 0.15,
                'SO2': point.SO2 if point.SO2 is not None else point.AQI * 0.08,
                'CO': point.CO if point.CO is not None else point.AQI * 0.02,
                'O3': point.O3 if point.O3 is not None else point.AQI * 0.12,
                'Temperature': point.Temperature if point.Temperature is not None else 25.0,
                'Humidity': point.Humidity if point.Humidity is not None else 50.0,
                'Wind Speed': point.Wind_Speed if point.Wind_Speed is not None else 5.0,
                'Wind Direction': point.Wind_Direction if point.Wind_Direction is not None else 180.0
            })
        
        historical_df = pd.DataFrame(historical_list)
        historical_df['datetime'] = pd.to_datetime(historical_df['datetime'])
        historical_df = historical_df.sort_values('datetime').reset_index(drop=True)
        
        # Prepare future weather if provided
        future_weather_df = None
        if request.future_weather:
            future_weather_df = pd.DataFrame(request.future_weather)
        
        # Generate forecast
        forecast_df = forecaster.forecast_24h(historical_df, future_weather_df)
        
        # Convert to response format
        forecasts = []
        for _, row in forecast_df.iterrows():
            forecasts.append({
                'datetime': row['datetime'].isoformat(),
                'AQI': float(row['AQI']),
                'hour_ahead': int(row['hour_ahead'])
            })
        
        # Return format compatible with frontend (forecasts) and user requirement (forecast)
        return {
            "forecast": forecasts,
            "forecasts": forecasts,  # Keep for backward compatibility
            "model_used": forecaster.model_name,
            "forecast_hours": 24,
            "generated_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

@app.get("/predict/72h", response_model=ForecastResponse)
async def predict_72h_get():
    """
    Generate 72-hour AQI forecast (GET endpoint - uses latest data from file)
    
    Returns:
        ForecastResponse with 72-hour predictions
    """
    if forecaster is None:
        raise HTTPException(status_code=503, detail="Forecaster not initialized")
    
    try:
        # Load latest data from file
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'aqi_data.csv')
        if not os.path.exists(data_path):
            raise HTTPException(status_code=404, detail="Data file not found. Please train models first.")
        
        historical_df = pd.read_csv(data_path)
        historical_df['datetime'] = pd.to_datetime(historical_df['datetime'])
        historical_df = historical_df.sort_values('datetime').reset_index(drop=True)
        
        # Use last 48 hours as historical data
        historical = historical_df.tail(48).copy()
        
        # Generate forecast
        forecast_df = forecaster.forecast_72h(historical)
        
        # Convert to response format
        forecasts = []
        for _, row in forecast_df.iterrows():
            forecasts.append({
                'datetime': row['datetime'].isoformat(),
                'AQI': float(row['AQI']),
                'hour_ahead': int(row['hour_ahead'])
            })
        
        # Return format compatible with frontend
        return {
            "forecast": forecasts,
            "forecasts": forecasts,  # Keep for backward compatibility
            "model_used": forecaster.model_name,
            "forecast_hours": 72,
            "generated_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

@app.post("/predict/72h", response_model=ForecastResponse)
async def predict_72h_post(request: ForecastRequest):
    """
    Generate 72-hour AQI forecast
    
    Args:
        request: ForecastRequest with historical data
    
    Returns:
        ForecastResponse with 72-hour predictions
    """
    if forecaster is None:
        raise HTTPException(status_code=503, detail="Forecaster not initialized")
    
    try:
        # Convert request to DataFrame
        historical_list = []
        for point in request.historical_data:
            historical_list.append({
                'datetime': point.datetime,
                'AQI': point.AQI,
                'PM2.5': point.PM2_5 if point.PM2_5 is not None else point.AQI * 0.4,
                'PM10': point.PM10 if point.PM10 is not None else point.AQI * 0.6,
                'NO2': point.NO2 if point.NO2 is not None else point.AQI * 0.15,
                'SO2': point.SO2 if point.SO2 is not None else point.AQI * 0.08,
                'CO': point.CO if point.CO is not None else point.AQI * 0.02,
                'O3': point.O3 if point.O3 is not None else point.AQI * 0.12,
                'Temperature': point.Temperature if point.Temperature is not None else 25.0,
                'Humidity': point.Humidity if point.Humidity is not None else 50.0,
                'Wind Speed': point.Wind_Speed if point.Wind_Speed is not None else 5.0,
                'Wind Direction': point.Wind_Direction if point.Wind_Direction is not None else 180.0
            })
        
        historical_df = pd.DataFrame(historical_list)
        historical_df['datetime'] = pd.to_datetime(historical_df['datetime'])
        historical_df = historical_df.sort_values('datetime').reset_index(drop=True)
        
        # Prepare future weather if provided
        future_weather_df = None
        if request.future_weather:
            future_weather_df = pd.DataFrame(request.future_weather)
        
        # Generate forecast
        forecast_df = forecaster.forecast_72h(historical_df, future_weather_df)
        
        # Convert to response format
        forecasts = []
        for _, row in forecast_df.iterrows():
            forecasts.append({
                'datetime': row['datetime'].isoformat(),
                'AQI': float(row['AQI']),
                'hour_ahead': int(row['hour_ahead'])
            })
        
        # Return format compatible with frontend
        return {
            "forecast": forecasts,
            "forecasts": forecasts,  # Keep for backward compatibility
            "model_used": forecaster.model_name,
            "forecast_hours": 72,
            "generated_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

