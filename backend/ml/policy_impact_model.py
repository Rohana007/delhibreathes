"""
Policy Impact ML Model - FastAPI Microservice
Calculates AQI after applying policy impacts using EPA AQI formula
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
from datetime import datetime
import uvicorn

app = FastAPI(title="Policy Impact ML Model", version="1.0.0")


class ForecastPoint(BaseModel):
    datetime: str
    aqi: float
    pollutants: Dict[str, float]


class BaselineForecastRequest(BaseModel):
    city: str
    zone: str
    duration_hours: int


class PolicyImpactRequest(BaseModel):
    baseline_forecast: List[Dict]
    policy_impacts: Dict[str, float]
    duration_hours: int


def calculate_aqi_epa(pollutants: Dict[str, float]) -> float:
    """
    Calculate AQI using EPA formula (simplified Indian AQI)
    Returns the maximum sub-index (worst pollutant)
    """
    pm25 = pollutants.get('PM2_5', 0)
    pm10 = pollutants.get('PM10', 0)
    no2 = pollutants.get('NO2', 0)
    so2 = pollutants.get('SO2', 0)
    co = pollutants.get('CO', 0)
    o3 = pollutants.get('O3', 0)
    
    sub_indices = []
    
    # PM2.5 sub-index (Indian AQI)
    if pm25 <= 30:
        sub_indices.append((pm25 / 30) * 50)
    elif pm25 <= 60:
        sub_indices.append(50 + ((pm25 - 30) / 30) * 50)
    elif pm25 <= 90:
        sub_indices.append(100 + ((pm25 - 60) / 30) * 50)
    elif pm25 <= 120:
        sub_indices.append(200 + ((pm25 - 90) / 30) * 100)
    elif pm25 <= 250:
        sub_indices.append(300 + ((pm25 - 120) / 130) * 100)
    else:
        sub_indices.append(400 + ((pm25 - 250) / 250) * 100)
    
    # PM10 sub-index
    if pm10 <= 50:
        sub_indices.append((pm10 / 50) * 50)
    elif pm10 <= 100:
        sub_indices.append(50 + ((pm10 - 50) / 50) * 50)
    elif pm10 <= 250:
        sub_indices.append(100 + ((pm10 - 100) / 150) * 100)
    elif pm10 <= 350:
        sub_indices.append(200 + ((pm10 - 250) / 100) * 100)
    elif pm10 <= 430:
        sub_indices.append(300 + ((pm10 - 350) / 80) * 100)
    else:
        sub_indices.append(400 + ((pm10 - 430) / 70) * 100)
    
    # NO2 sub-index
    if no2 <= 40:
        sub_indices.append((no2 / 40) * 50)
    elif no2 <= 80:
        sub_indices.append(50 + ((no2 - 40) / 40) * 50)
    elif no2 <= 180:
        sub_indices.append(100 + ((no2 - 80) / 100) * 100)
    elif no2 <= 280:
        sub_indices.append(200 + ((no2 - 180) / 100) * 100)
    elif no2 <= 400:
        sub_indices.append(300 + ((no2 - 280) / 120) * 100)
    else:
        sub_indices.append(400 + ((no2 - 400) / 400) * 100)
    
    # CO sub-index (convert to mg/m³)
    co_mg = co * 1.15
    if co_mg <= 1:
        sub_indices.append((co_mg / 1) * 50)
    elif co_mg <= 2:
        sub_indices.append(50 + ((co_mg - 1) / 1) * 50)
    elif co_mg <= 10:
        sub_indices.append(100 + ((co_mg - 2) / 8) * 100)
    elif co_mg <= 17:
        sub_indices.append(200 + ((co_mg - 10) / 7) * 100)
    elif co_mg <= 34:
        sub_indices.append(300 + ((co_mg - 17) / 17) * 100)
    else:
        sub_indices.append(400 + ((co_mg - 34) / 34) * 100)
    
    # O3 sub-index
    if o3 <= 50:
        sub_indices.append((o3 / 50) * 50)
    elif o3 <= 100:
        sub_indices.append(50 + ((o3 - 50) / 50) * 50)
    elif o3 <= 168:
        sub_indices.append(100 + ((o3 - 100) / 68) * 100)
    elif o3 <= 208:
        sub_indices.append(200 + ((o3 - 168) / 40) * 100)
    elif o3 <= 748:
        sub_indices.append(300 + ((o3 - 208) / 540) * 100)
    else:
        sub_indices.append(400 + ((o3 - 748) / 252) * 100)
    
    # SO2 sub-index
    if so2 <= 40:
        sub_indices.append((so2 / 40) * 50)
    elif so2 <= 80:
        sub_indices.append(50 + ((so2 - 40) / 40) * 50)
    elif so2 <= 380:
        sub_indices.append(100 + ((so2 - 80) / 300) * 100)
    elif so2 <= 800:
        sub_indices.append(200 + ((so2 - 380) / 420) * 100)
    elif so2 <= 1600:
        sub_indices.append(300 + ((so2 - 800) / 800) * 100)
    else:
        sub_indices.append(400 + ((so2 - 1600) / 400) * 100)
    
    return round(max(sub_indices))


def apply_policy_impact(pollutants: Dict[str, float], policy_impacts: Dict[str, float]) -> Dict[str, float]:
    """
    Apply policy impact percentages to pollutants
    policy_impacts: {"PM2.5": -18, "NO2": -22, ...} (negative = reduction)
    """
    modified = pollutants.copy()
    
    # Map config keys to pollutant keys
    key_map = {
        'PM2.5': 'PM2_5',
        'PM10': 'PM10',
        'NO2': 'NO2',
        'SO2': 'SO2',
        'CO': 'CO',
        'O3': 'O3',
    }
    
    for pollutant_key, reduction_percent in policy_impacts.items():
        mapped_key = key_map.get(pollutant_key, pollutant_key)
        if mapped_key in modified:
            # Apply reduction: new = old * (1 + reduction/100)
            # e.g., -18% means new = old * 0.82
            modified[mapped_key] = max(0, modified[mapped_key] * (1 + reduction_percent / 100))
    
    return modified


@app.get("/")
async def root():
    return {
        "service": "Policy Impact ML Model",
        "version": "1.0.0",
        "status": "running"
    }


@app.post("/forecast/baseline")
async def get_baseline_forecast(request: BaselineForecastRequest):
    """
    Generate baseline AQI forecast for a city-zone
    In production, this would call your LSTM model
    For now, returns simulated data based on city-zone baseline
    """
    try:
        # In production, call your actual LSTM model here
        # For now, generate simulated forecast based on city-zone
        
        # Load city-zone baseline data (would come from database/model)
        # For now, use default values based on city-zone
        baseline_aqi_map = {
            "Delhi": {"North": 290, "South": 255, "East": 280, "West": 265, "Central": 300},
            "Gurugram": {"North": 275, "South": 250, "East": 270, "West": 260, "Central": 285},
            "Noida": {"North": 268, "South": 245, "East": 265, "West": 258, "Central": 278},
            "Ghaziabad": {"North": 272, "South": 248, "East": 268, "West": 262, "Central": 282},
            "Faridabad": {"North": 270, "South": 246, "East": 266, "West": 260, "Central": 280},
        }
        
        baseline_aqi = baseline_aqi_map.get(request.city, {}).get(request.zone, 280)
        
        forecast = []
        from datetime import timedelta
        
        # Generate forecast points
        now = datetime.now()
        for i in range(request.duration_hours):
            timestamp = now + timedelta(hours=i)
            
            # Simulate natural variation
            variation = np.sin(i / 12) * 15 + np.random.normal(0, 5)
            aqi = max(50, min(500, baseline_aqi + variation))
            
            # Generate pollutant values based on AQI (simplified)
            pollutants = {
                'PM2_5': max(0, (aqi / 2.5) + np.random.normal(0, 10)),
                'PM10': max(0, (aqi / 1.5) + np.random.normal(0, 15)),
                'NO2': max(0, (aqi / 4.5) + np.random.normal(0, 5)),
                'SO2': max(0, (aqi / 8) + np.random.normal(0, 3)),
                'CO': max(0, (aqi / 35) + np.random.normal(0, 1)),
                'O3': max(0, (aqi / 6) + np.random.normal(0, 5)),
            }
            
            forecast.append({
                'datetime': timestamp.isoformat(),
                'aqi': round(aqi),
                'pollutants': {k: round(v, 2) for k, v in pollutants.items()}
            })
        
        return {
            "success": True,
            "forecast": forecast
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/apply-policy")
async def apply_policy(request: PolicyImpactRequest):
    """
    Apply policy impact to baseline forecast
    POST /apply-policy
    """
    return await get_policy_impact_forecast(request)


@app.post("/forecast/policy-impact")
async def get_policy_impact_forecast(request: PolicyImpactRequest):
    """
    Generate forecast after applying policy impacts
    """
    try:
        forecast = []
        
        for point in request.baseline_forecast:
            # Apply policy impacts to pollutants
            modified_pollutants = apply_policy_impact(
                point['pollutants'],
                request.policy_impacts
            )
            
            # Recalculate AQI with modified pollutants
            new_aqi = calculate_aqi_epa(modified_pollutants)
            
            forecast.append({
                'datetime': point['datetime'],
                'aqi': new_aqi,
                'pollutants': {k: round(v, 2) for k, v in modified_pollutants.items()}
            })
        
        return {
            "success": True,
            "forecast": forecast
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

