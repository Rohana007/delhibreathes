"""
Predict AQI using trained LSTM model
"""
import numpy as np
import pandas as pd
import pickle
import os
from tensorflow.keras.models import load_model
from preprocess import AQIPreprocessor

class AQIForecaster:
    """Forecast AQI using trained LSTM model"""
    
    def __init__(self, model_path='models/aqi_lstm_model.h5'):
        """Load trained model and scalers"""
        print("Loading model and scalers...")
        
        # Load model
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}. Please train the model first.")
        self.model = load_model(model_path)
        
        # Load scalers
        with open('models/scaler_X.pkl', 'rb') as f:
            self.scaler_X = pickle.load(f)
        
        with open('models/scaler_y.pkl', 'rb') as f:
            self.scaler_y = pickle.load(f)
        
        with open('models/feature_columns.pkl', 'rb') as f:
            self.feature_columns = pickle.load(f)
        
        self.window_size = 24
        print("✅ Model and scalers loaded")
    
    def prepare_features_from_data(self, df):
        """Prepare features from raw data (same as preprocessing)"""
        df = df.copy()
        
        # Time features
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek
        df['month'] = df['datetime'].dt.month
        
        # Cyclical encoding
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        # Lag features for AQI
        for lag in [1, 3, 6, 12, 24]:
            df[f'AQI_lag_{lag}h'] = df['AQI'].shift(lag)
        
        # Rolling statistics
        for window in [3, 6, 12]:
            df[f'AQI_rolling_mean_{window}h'] = df['AQI'].rolling(window=window, min_periods=1).mean()
            df[f'AQI_rolling_std_{window}h'] = df['AQI'].rolling(window=window, min_periods=1).std()
        
        return df
    
    def forecast_next_hour(self, historical_data):
        """
        Forecast AQI for the next hour
        
        Args:
            historical_data: DataFrame with at least 24 hours of historical data
                           Must have columns: datetime, AQI, PM2.5, PM10, NO2, SO2, CO, O3,
                                             Temperature, Humidity, Wind Speed, Wind Direction
        
        Returns:
            float: Predicted AQI value
        """
        # Ensure datetime is datetime type
        if not pd.api.types.is_datetime64_any_dtype(historical_data['datetime']):
            historical_data['datetime'] = pd.to_datetime(historical_data['datetime'])
        
        # Sort by datetime
        historical_data = historical_data.sort_values('datetime').reset_index(drop=True)
        
        # Need at least window_size hours of data
        if len(historical_data) < self.window_size:
            raise ValueError(f"Need at least {self.window_size} hours of historical data. Got {len(historical_data)}")
        
        # Take last window_size hours
        recent_data = historical_data.tail(self.window_size).copy()
        
        # Prepare features
        recent_data = self.prepare_features_from_data(recent_data)
        
        # Fill NaN from lag features (use forward fill)
        recent_data = recent_data.ffill().bfill()
        
        # Extract features in correct order
        X = recent_data[self.feature_columns].values
        
        # Scale features
        X_scaled = self.scaler_X.transform(X)
        
        # Reshape for LSTM: (1, window_size, n_features)
        X_seq = X_scaled.reshape(1, self.window_size, len(self.feature_columns))
        
        # Predict
        y_pred_scaled = self.model.predict(X_seq, verbose=0)
        
        # Inverse transform
        y_pred = self.scaler_y.inverse_transform(y_pred_scaled)[0][0]
        
        # Clip to valid AQI range
        y_pred = max(0, min(500, y_pred))
        
        return float(y_pred)
    
    def forecast_multiple_hours(self, historical_data, n_hours=24):
        """
        Forecast AQI for multiple hours ahead (iterative)
        
        Args:
            historical_data: DataFrame with historical data
            n_hours: Number of hours to forecast ahead
        
        Returns:
            list: List of predicted AQI values
        """
        predictions = []
        current_data = historical_data.copy()
        
        for hour in range(n_hours):
            # Forecast next hour
            pred = self.forecast_next_hour(current_data)
            predictions.append(pred)
            
            # Append prediction to current_data for next iteration
            # Create a new row with predicted AQI
            last_row = current_data.iloc[-1:].copy()
            last_row['datetime'] = pd.to_datetime(last_row['datetime']) + pd.Timedelta(hours=1)
            last_row['AQI'] = pred
            
            # For other features, use last known values (or could use forecasts)
            current_data = pd.concat([current_data, last_row], ignore_index=True)
            current_data = current_data.tail(self.window_size + 10).reset_index(drop=True)
        
        return predictions

def forecast_next_hour(historical_data):
    """
    Convenience function to forecast next hour AQI
    
    Args:
        historical_data: DataFrame or path to CSV with historical AQI data
                       Must have at least 24 hours of data
    
    Returns:
        float: Predicted AQI for next hour
    """
    # Load forecaster
    forecaster = AQIForecaster()
    
    # Load data if path provided
    if isinstance(historical_data, str):
        historical_data = pd.read_csv(historical_data)
        historical_data['datetime'] = pd.to_datetime(historical_data['datetime'])
    
    # Forecast
    prediction = forecaster.forecast_next_hour(historical_data)
    
    return prediction

if __name__ == '__main__':
    # Example usage
    print("="*60)
    print("AQI FORECASTING - PREDICTION")
    print("="*60)
    
    # Load historical data
    df = pd.read_csv('data/aqi_data.csv')
    df['datetime'] = pd.to_datetime(df['datetime'])
    
    # Get last 24 hours
    recent_data = df.tail(24)
    
    # Forecast next hour
    forecaster = AQIForecaster()
    prediction = forecaster.forecast_next_hour(recent_data)
    
    print(f"\n✅ Predicted AQI for next hour: {prediction:.2f}")
    
    # Forecast 24 hours
    print("\nForecasting next 24 hours...")
    predictions_24h = forecaster.forecast_multiple_hours(recent_data, n_hours=24)
    print(f"✅ Forecasted AQI for next 24 hours:")
    for i, pred in enumerate(predictions_24h, 1):
        print(f"   Hour {i}: {pred:.2f}")

