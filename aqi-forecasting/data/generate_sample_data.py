"""
Generate synthetic but realistic AQI dataset for training
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_aqi_data(start_date='2023-01-01', days=365):
    """
    Generate synthetic AQI data with realistic patterns
    
    Args:
        start_date: Start date for data generation
        days: Number of days to generate
    
    Returns:
        DataFrame with AQI and related features
    """
    np.random.seed(42)
    
    # Generate datetime range (hourly data)
    start = pd.to_datetime(start_date)
    dates = pd.date_range(start=start, periods=days*24, freq='H')
    
    n = len(dates)
    
    # Generate base patterns
    hour_of_day = dates.hour
    day_of_year = dates.dayofyear
    month = dates.month
    
    # Seasonal patterns (winter has higher pollution in Delhi, but allow stronger extremes)
    seasonal_factor = 1.0 + 0.8 * np.sin(2 * np.pi * day_of_year / 365)
    
    # Diurnal patterns (higher pollution in morning and evening)
    diurnal_factor = 1.0 + 0.4 * np.sin(2 * np.pi * hour_of_day / 24 + np.pi/2)
    
    # Base AQI with stronger variability so the model sees a wide range (roughly 50–400)
    base_aqi = 70 + 90 * seasonal_factor * diurnal_factor
    
    # Add random noise and trends (increase noise to widen the distribution)
    trend = np.linspace(-20, 40, n)  # Mild long-term trend across the year
    noise = np.random.normal(0, 30, n)
    
    # Generate AQI (0-500 range)
    aqi = np.clip(base_aqi + trend + noise, 0, 500)
    
    # Generate pollutant concentrations based on AQI
    # PM2.5 (primary contributor)
    pm25 = aqi * 0.4 + np.random.normal(0, 10, n)
    pm25 = np.clip(pm25, 0, 300)
    
    # PM10
    pm10 = pm25 * 1.5 + np.random.normal(0, 15, n)
    pm10 = np.clip(pm10, 0, 500)
    
    # NO2
    no2 = aqi * 0.15 + np.random.normal(0, 5, n)
    no2 = np.clip(no2, 0, 200)
    
    # SO2
    so2 = aqi * 0.08 + np.random.normal(0, 3, n)
    so2 = np.clip(so2, 0, 100)
    
    # CO (in mg/m³)
    co = aqi * 0.02 + np.random.normal(0, 0.5, n)
    co = np.clip(co, 0, 10)
    
    # O3
    o3 = aqi * 0.12 + np.random.normal(0, 8, n)
    o3 = np.clip(o3, 0, 200)
    
    # Weather features
    # Temperature (Delhi: 5°C to 45°C)
    temp_base = 25 + 15 * np.sin(2 * np.pi * day_of_year / 365)
    temp_diurnal = 5 * np.sin(2 * np.pi * hour_of_day / 24 - np.pi/2)
    temperature = temp_base + temp_diurnal + np.random.normal(0, 2, n)
    temperature = np.clip(temperature, 5, 45)
    
    # Humidity (30% to 90%)
    humidity = 50 + 20 * np.sin(2 * np.pi * day_of_year / 365 + np.pi) + np.random.normal(0, 10, n)
    humidity = np.clip(humidity, 30, 90)
    
    # Wind Speed (0 to 20 km/h)
    wind_speed = 5 + 5 * np.random.exponential(1, n)
    wind_speed = np.clip(wind_speed, 0, 20)
    
    # Wind Direction (0 to 360 degrees)
    wind_direction = np.random.uniform(0, 360, n)
    
    # Create DataFrame
    df = pd.DataFrame({
        'datetime': dates,
        'AQI': aqi,
        'PM2.5': pm25,
        'PM10': pm10,
        'NO2': no2,
        'SO2': so2,
        'CO': co,
        'O3': o3,
        'Temperature': temperature,
        'Humidity': humidity,
        'Wind Speed': wind_speed,
        'Wind Direction': wind_direction
    })
    
    return df

if __name__ == '__main__':
    # Generate 1 year of hourly data
    print("Generating synthetic AQI data...")
    df = generate_aqi_data(start_date='2023-01-01', days=365)
    
    # Save to CSV
    os.makedirs('../data', exist_ok=True)
    output_path = '../data/aqi_data.csv'
    df.to_csv(output_path, index=False)
    print(f"✅ Generated {len(df)} records")
    print(f"✅ Saved to {output_path}")
    print(f"\nData preview:")
    print(df.head())
    print(f"\nData statistics:")
    print(df.describe())

