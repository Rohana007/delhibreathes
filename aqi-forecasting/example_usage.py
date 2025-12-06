"""
Example usage of the AQI forecasting system
"""
import pandas as pd
from scripts.forecast import AQIForecaster

def main():
    print("="*50)
    print("AQI FORECASTING - EXAMPLE USAGE")
    print("="*50)
    
    # Load historical data
    print("\n1. Loading historical data...")
    historical_data = pd.read_csv('data/aqi_data.csv')
    historical_data['datetime'] = pd.to_datetime(historical_data['datetime'])
    historical_data = historical_data.sort_values('datetime').reset_index(drop=True)
    
    # Use last 48 hours as historical context
    historical = historical_data.tail(48).copy()
    print(f"✅ Using {len(historical)} hours of historical data")
    
    # Initialize forecaster
    print("\n2. Initializing forecaster...")
    forecaster = AQIForecaster(model_path='models')
    
    # Generate 24-hour forecast
    print("\n3. Generating 24-hour forecast...")
    forecast_24h = forecaster.forecast_24h(historical)
    
    print("\n24-Hour Forecast Preview:")
    print(forecast_24h[['datetime', 'AQI', 'hour_ahead']].head(10))
    print(f"\nAverage AQI (24h): {forecast_24h['AQI'].mean():.2f}")
    print(f"Max AQI (24h): {forecast_24h['AQI'].max():.2f}")
    print(f"Min AQI (24h): {forecast_24h['AQI'].min():.2f}")
    
    # Generate 72-hour forecast
    print("\n4. Generating 72-hour forecast...")
    forecast_72h = forecaster.forecast_72h(historical)
    
    print("\n72-Hour Forecast Preview:")
    print(forecast_72h[['datetime', 'AQI', 'hour_ahead']].head(10))
    print(f"\nAverage AQI (72h): {forecast_72h['AQI'].mean():.2f}")
    print(f"Max AQI (72h): {forecast_72h['AQI'].max():.2f}")
    print(f"Min AQI (72h): {forecast_72h['AQI'].min():.2f}")
    
    # Save forecasts
    forecast_24h.to_csv('data/forecast_24h.csv', index=False)
    forecast_72h.to_csv('data/forecast_72h.csv', index=False)
    print("\n✅ Forecasts saved to data/forecast_24h.csv and data/forecast_72h.csv")
    
    print("\n" + "="*50)
    print("✅ EXAMPLE COMPLETE!")
    print("="*50)

if __name__ == '__main__':
    main()

