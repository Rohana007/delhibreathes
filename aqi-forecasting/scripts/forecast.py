"""
Generate 24-hour and 72-hour AQI forecasts using trained models
"""
import numpy as np
import pandas as pd
import joblib
import json
from datetime import datetime, timedelta
import os
import warnings
warnings.filterwarnings('ignore')

# Try to import TensorFlow (for LSTM)
try:
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("Warning: TensorFlow not available. LSTM predictions will be skipped.")

class AQIForecaster:
    """Generate AQI forecasts using trained models"""
    
    def __init__(self, model_path='../models'):
        self.model_path = model_path
        self.scaler = None
        self.model = None
        self.model_name = None
        self.feature_cols = None
        self.sequence_length = 24  # For LSTM
        
        self.load_model()
    
    def load_model(self):
        """Load the best trained model"""
        print("Loading model...")
        
        # Load best model info
        best_model_path = os.path.join(self.model_path, 'best_model.json')
        if not os.path.exists(best_model_path):
            raise FileNotFoundError(f"Model not found at {best_model_path}. Please train models first: python train_model.py")
        
        with open(best_model_path, 'r') as f:
            model_info = json.load(f)
        
        self.model_name = model_info['best_model']
        print(f"Loading {self.model_name} model...")
        
        # Load scaler
        scaler_path = os.path.join(self.model_path, 'scaler.pkl')
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(f"Scaler not found at {scaler_path}")
        self.scaler = joblib.load(scaler_path)
        
        # Load feature columns
        # Get the script directory and construct path relative to project root
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        feature_cols_path = os.path.join(project_root, 'data', 'processed', 'feature_columns.json')
        if not os.path.exists(feature_cols_path):
            raise FileNotFoundError(f"Feature columns not found at {feature_cols_path}")
        with open(feature_cols_path, 'r') as f:
            self.feature_cols = json.load(f)
        
        # Load model based on type
        if self.model_name == 'RandomForest':
            model_file = os.path.join(self.model_path, 'random_forest.pkl')
            if not os.path.exists(model_file):
                raise FileNotFoundError(f"Random Forest model not found at {model_file}")
            self.model = joblib.load(model_file)
        elif self.model_name == 'XGBoost':
            model_file = os.path.join(self.model_path, 'xgboost.pkl')
            if not os.path.exists(model_file):
                raise FileNotFoundError(f"XGBoost model not found at {model_file}")
            self.model = joblib.load(model_file)
        elif self.model_name == 'LSTM':
            if not TF_AVAILABLE:
                raise ImportError("TensorFlow required for LSTM model")
            model_file = os.path.join(self.model_path, 'lstm_best.h5')
            if not os.path.exists(model_file):
                raise FileNotFoundError(f"LSTM model not found at {model_file}")
            # Handle Keras 3.x compatibility
            try:
                self.model = keras.models.load_model(model_file)
            except (ValueError, AttributeError, TypeError) as e:
                # Keras 3.x has breaking changes - try to fallback to another model
                print(f"⚠️  Warning: LSTM model incompatible with Keras 3.x: {e}")
                print("⚠️  Attempting to fallback to Random Forest or XGBoost...")
                
                # Try to load Random Forest as fallback
                rf_file = os.path.join(self.model_path, 'random_forest.pkl')
                xgb_file = os.path.join(self.model_path, 'xgboost.pkl')
                
                if os.path.exists(rf_file):
                    print("✅ Falling back to Random Forest model")
                    self.model_name = 'RandomForest'
                    self.model = joblib.load(rf_file)
                elif os.path.exists(xgb_file):
                    print("✅ Falling back to XGBoost model")
                    self.model_name = 'XGBoost'
                    self.model = joblib.load(xgb_file)
                else:
                    error_msg = (
                        f"LSTM model incompatible with Keras 3.x and no fallback models available.\n"
                        f"Please retrain the models by running: python train_model.py\n"
                        f"Original error: {str(e)}"
                    )
                    raise ImportError(error_msg)
        else:
            raise ValueError(f"Unknown model: {self.model_name}")
        
        print(f"✅ Loaded {self.model_name} model")
    
    def prepare_input_features(self, historical_data):
        """
        Prepare input features from historical data
        
        Args:
            historical_data: DataFrame with historical AQI and weather data
        
        Returns:
            numpy array of features ready for prediction
        """
        # Ensure we have enough historical data
        if len(historical_data) < 24:
            raise ValueError("Need at least 24 hours of historical data")
        
        # Take last 24 hours for feature engineering
        df = historical_data.tail(24).copy()
        
        # Create time features
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek
        df['day_of_month'] = df['datetime'].dt.day
        df['month'] = df['datetime'].dt.month
        df['day_of_year'] = df['datetime'].dt.dayofyear
        
        # Cyclical encoding
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        # Create lag features (using last known values)
        last_aqi = df['AQI'].iloc[-1]
        last_pm25 = df['PM2.5'].iloc[-1]
        last_pm10 = df['PM10'].iloc[-1]
        last_no2 = df['NO2'].iloc[-1]
        
        for lag in [1, 3, 6, 12, 24]:
            if lag <= len(df):
                df[f'AQI_lag_{lag}h'] = df['AQI'].iloc[-lag]
            else:
                df[f'AQI_lag_{lag}h'] = last_aqi
        
        for lag in [1, 6, 24]:
            if lag <= len(df):
                df[f'PM2.5_lag_{lag}h'] = df['PM2.5'].iloc[-lag]
                df[f'PM10_lag_{lag}h'] = df['PM10'].iloc[-lag]
                df[f'NO2_lag_{lag}h'] = df['NO2'].iloc[-lag]
            else:
                df[f'PM2.5_lag_{lag}h'] = last_pm25
                df[f'PM10_lag_{lag}h'] = last_pm10
                df[f'NO2_lag_{lag}h'] = last_no2
        
        # Rolling features
        for window in [3, 6, 12, 24]:
            df[f'AQI_rolling_mean_{window}h'] = df['AQI'].rolling(window=min(window, len(df)), min_periods=1).mean().iloc[-1]
            df[f'AQI_rolling_std_{window}h'] = df['AQI'].rolling(window=min(window, len(df)), min_periods=1).std().iloc[-1]
        
        # Interaction features
        last_row = df.iloc[-1]
        df['temp_pm25'] = last_row['Temperature'] * last_row['PM2.5']
        df['temp_pm10'] = last_row['Temperature'] * last_row['PM10']
        df['wind_pm25'] = last_row['Wind Speed'] * last_row['PM2.5']
        df['wind_pm10'] = last_row['Wind Speed'] * last_row['PM10']
        df['humidity_pm25'] = last_row['Humidity'] * last_row['PM2.5']
        df['pollutant_index'] = (
            last_row['PM2.5'] * 0.4 + 
            last_row['PM10'] * 0.3 + 
            last_row['NO2'] * 0.15 + 
            last_row['O3'] * 0.1 + 
            last_row['SO2'] * 0.05
        )
        
        # Get feature vector (use last row with all engineered features)
        feature_vector = df[self.feature_cols].iloc[-1].values.reshape(1, -1)
        
        # Scale features
        feature_vector_scaled = self.scaler.transform(feature_vector)
        
        return feature_vector_scaled
    
    def forecast_24h(self, historical_data, future_weather=None):
        """
        Generate 24-hour forecast
        
        Args:
            historical_data: DataFrame with historical data
            future_weather: Optional DataFrame with future weather forecasts
        
        Returns:
            DataFrame with 24-hour forecast
        """
        print("Generating 24-hour forecast...")
        
        forecasts = []
        current_data = historical_data.copy()
        
        for hour in range(24):
            # Prepare features
            if self.model_name == 'LSTM':
                # LSTM needs sequence
                if len(current_data) >= self.sequence_length:
                    seq_data = current_data.tail(self.sequence_length)
                else:
                    # Pad with last value
                    padding = pd.concat([current_data.iloc[-1:]] * (self.sequence_length - len(current_data)))
                    seq_data = pd.concat([padding, current_data])
                
                # Prepare sequence features
                X_seq = self._prepare_lstm_sequence(seq_data)
                pred = self.model.predict(X_seq, verbose=0)[0][0]
            else:
                # Tree-based models
                X = self.prepare_input_features(current_data)
                pred = self.model.predict(X)[0]
            
            # Get future datetime
            if len(current_data) > 0:
                last_time = pd.to_datetime(current_data['datetime'].iloc[-1])
            else:
                last_time = pd.to_datetime(historical_data['datetime'].iloc[-1])
            
            future_time = last_time + timedelta(hours=1)
            
            # Create forecast row
            forecast_row = {
                'datetime': future_time,
                'AQI': max(0, min(500, pred)),  # Clip to valid range
                'hour_ahead': hour + 1
            }
            
            # Add future weather if available
            if future_weather is not None and hour < len(future_weather):
                forecast_row.update(future_weather.iloc[hour].to_dict())
            
            forecasts.append(forecast_row)
            
            # Update current_data with forecast (for next iteration)
            forecast_df = pd.DataFrame([forecast_row])
            # Estimate pollutants from AQI (simplified)
            forecast_df['PM2.5'] = forecast_row['AQI'] * 0.4
            forecast_df['PM10'] = forecast_row['AQI'] * 0.6
            forecast_df['NO2'] = forecast_row['AQI'] * 0.15
            forecast_df['SO2'] = forecast_row['AQI'] * 0.08
            forecast_df['CO'] = forecast_row['AQI'] * 0.02
            forecast_df['O3'] = forecast_row['AQI'] * 0.12
            
            # Use historical weather if future weather not available
            if future_weather is None or hour >= len(future_weather):
                last_weather = current_data.iloc[-1] if len(current_data) > 0 else historical_data.iloc[-1]
                forecast_df['Temperature'] = last_weather['Temperature']
                forecast_df['Humidity'] = last_weather['Humidity']
                forecast_df['Wind Speed'] = last_weather['Wind Speed']
                forecast_df['Wind Direction'] = last_weather['Wind Direction']
            
            current_data = pd.concat([current_data, forecast_df]).reset_index(drop=True)
        
        forecast_df = pd.DataFrame(forecasts)
        print(f"✅ Generated 24-hour forecast")
        return forecast_df
    
    def forecast_6h(self, historical_data, future_weather=None):
        """
        Generate 6-hour forecast
        
        Args:
            historical_data: DataFrame with historical data
            future_weather: Optional DataFrame with future weather forecasts
        
        Returns:
            DataFrame with 6-hour forecast
        """
        print("Generating 6-hour forecast...")
        
        forecasts = []
        current_data = historical_data.copy()
        
        for hour in range(6):
            # Prepare features
            if self.model_name == 'LSTM':
                # LSTM needs sequence
                if len(current_data) >= self.sequence_length:
                    seq_data = current_data.tail(self.sequence_length)
                else:
                    # Pad with last value
                    padding = pd.concat([current_data.iloc[-1:]] * (self.sequence_length - len(current_data)))
                    seq_data = pd.concat([padding, current_data])
                
                # Prepare sequence features
                X_seq = self._prepare_lstm_sequence(seq_data)
                pred = self.model.predict(X_seq, verbose=0)[0][0]
            else:
                # Tree-based models
                X = self.prepare_input_features(current_data)
                pred = self.model.predict(X)[0]
            
            # Get future datetime
            if len(current_data) > 0:
                last_time = pd.to_datetime(current_data['datetime'].iloc[-1])
            else:
                last_time = pd.to_datetime(historical_data['datetime'].iloc[-1])
            
            future_time = last_time + timedelta(hours=1)
            
            # Create forecast row
            forecast_row = {
                'datetime': future_time,
                'AQI': max(0, min(500, pred)),  # Clip to valid range
                'hour_ahead': hour + 1
            }
            
            # Add future weather if available
            if future_weather is not None and hour < len(future_weather):
                forecast_row.update(future_weather.iloc[hour].to_dict())
            
            forecasts.append(forecast_row)
            
            # Update current_data with forecast (for next iteration)
            forecast_df = pd.DataFrame([forecast_row])
            # Estimate pollutants from AQI (simplified)
            forecast_df['PM2.5'] = forecast_row['AQI'] * 0.4
            forecast_df['PM10'] = forecast_row['AQI'] * 0.6
            forecast_df['NO2'] = forecast_row['AQI'] * 0.15
            forecast_df['SO2'] = forecast_row['AQI'] * 0.08
            forecast_df['CO'] = forecast_row['AQI'] * 0.02
            forecast_df['O3'] = forecast_row['AQI'] * 0.12
            
            # Use historical weather if future weather not available
            if future_weather is None or hour >= len(future_weather):
                last_weather = current_data.iloc[-1] if len(current_data) > 0 else historical_data.iloc[-1]
                forecast_df['Temperature'] = last_weather['Temperature']
                forecast_df['Humidity'] = last_weather['Humidity']
                forecast_df['Wind Speed'] = last_weather['Wind Speed']
                forecast_df['Wind Direction'] = last_weather['Wind Direction']
            
            current_data = pd.concat([current_data, forecast_df]).reset_index(drop=True)
        
        forecast_df = pd.DataFrame(forecasts)
        print(f"✅ Generated 6-hour forecast")
        return forecast_df
    
    def forecast_72h(self, historical_data, future_weather=None):
        """
        Generate 72-hour forecast
        
        Args:
            historical_data: DataFrame with historical data
            future_weather: Optional DataFrame with future weather forecasts
        
        Returns:
            DataFrame with 72-hour forecast
        """
        print("Generating 72-hour forecast...")
        
        forecasts = []
        current_data = historical_data.copy()
        
        for hour in range(72):
            # Prepare features
            if self.model_name == 'LSTM':
                # LSTM needs sequence
                if len(current_data) >= self.sequence_length:
                    seq_data = current_data.tail(self.sequence_length)
                else:
                    padding = pd.concat([current_data.iloc[-1:]] * (self.sequence_length - len(current_data)))
                    seq_data = pd.concat([padding, current_data])
                
                X_seq = self._prepare_lstm_sequence(seq_data)
                pred = self.model.predict(X_seq, verbose=0)[0][0]
            else:
                X = self.prepare_input_features(current_data)
                pred = self.model.predict(X)[0]
            
            # Get future datetime
            if len(current_data) > 0:
                last_time = pd.to_datetime(current_data['datetime'].iloc[-1])
            else:
                last_time = pd.to_datetime(historical_data['datetime'].iloc[-1])
            
            future_time = last_time + timedelta(hours=1)
            
            # Create forecast row
            forecast_row = {
                'datetime': future_time,
                'AQI': max(0, min(500, pred)),
                'hour_ahead': hour + 1
            }
            
            # Add future weather if available
            if future_weather is not None and hour < len(future_weather):
                forecast_row.update(future_weather.iloc[hour].to_dict())
            
            forecasts.append(forecast_row)
            
            # Update current_data
            forecast_df = pd.DataFrame([forecast_row])
            forecast_df['PM2.5'] = forecast_row['AQI'] * 0.4
            forecast_df['PM10'] = forecast_row['AQI'] * 0.6
            forecast_df['NO2'] = forecast_row['AQI'] * 0.15
            forecast_df['SO2'] = forecast_row['AQI'] * 0.08
            forecast_df['CO'] = forecast_row['AQI'] * 0.02
            forecast_df['O3'] = forecast_row['AQI'] * 0.12
            
            if future_weather is None or hour >= len(future_weather):
                last_weather = current_data.iloc[-1] if len(current_data) > 0 else historical_data.iloc[-1]
                forecast_df['Temperature'] = last_weather['Temperature']
                forecast_df['Humidity'] = last_weather['Humidity']
                forecast_df['Wind Speed'] = last_weather['Wind Speed']
                forecast_df['Wind Direction'] = last_weather['Wind Direction']
            
            current_data = pd.concat([current_data, forecast_df]).reset_index(drop=True)
        
        forecast_df = pd.DataFrame(forecasts)
        print(f"✅ Generated 72-hour forecast")
        return forecast_df
    
    def _prepare_lstm_sequence(self, data):
        """Prepare sequence data for LSTM"""
        # Create all features for the sequence
        df = data.copy()
        
        # Add time features
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek
        df['month'] = df['datetime'].dt.month
        
        # Create features for each timestep
        features_list = []
        for idx in range(len(df)):
            row = df.iloc[idx]
            feature_dict = {}
            
            # Base features
            for col in ['PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3', 
                       'Temperature', 'Humidity', 'Wind Speed', 'Wind Direction']:
                feature_dict[col] = row[col]
            
            # Time features
            feature_dict['hour_sin'] = np.sin(2 * np.pi * row['hour'] / 24)
            feature_dict['hour_cos'] = np.cos(2 * np.pi * row['hour'] / 24)
            feature_dict['month_sin'] = np.sin(2 * np.pi * row['month'] / 12)
            feature_dict['month_cos'] = np.cos(2 * np.pi * row['month'] / 12)
            
            # Lag features (simplified - use current values)
            feature_dict['AQI_lag_1h'] = row['AQI']
            feature_dict['AQI_lag_3h'] = row['AQI']
            feature_dict['AQI_lag_6h'] = row['AQI']
            feature_dict['AQI_lag_12h'] = row['AQI']
            feature_dict['AQI_lag_24h'] = row['AQI']
            
            features_list.append([feature_dict.get(col, 0) for col in self.feature_cols])
        
        X_seq = np.array(features_list).reshape(1, len(df), len(self.feature_cols))
        X_seq_scaled = self.scaler.transform(X_seq.reshape(-1, len(self.feature_cols))).reshape(1, len(df), len(self.feature_cols))
        
        return X_seq_scaled

if __name__ == '__main__':
    # Example usage
    print("="*50)
    print("AQI FORECASTING")
    print("="*50)
    
    # Load historical data
    historical_data = pd.read_csv('../data/aqi_data.csv')
    historical_data['datetime'] = pd.to_datetime(historical_data['datetime'])
    historical_data = historical_data.sort_values('datetime').reset_index(drop=True)
    
    # Take last 48 hours as historical data
    historical = historical_data.tail(48).copy()
    
    # Initialize forecaster
    forecaster = AQIForecaster()
    
    # Generate forecasts
    forecast_24h = forecaster.forecast_24h(historical)
    forecast_72h = forecaster.forecast_72h(historical)
    
    # Display results
    print("\n24-Hour Forecast:")
    print(forecast_24h[['datetime', 'AQI', 'hour_ahead']].head(10))
    
    print("\n72-Hour Forecast (first 10 hours):")
    print(forecast_72h[['datetime', 'AQI', 'hour_ahead']].head(10))
    
    # Save forecasts
    forecast_24h.to_csv('../data/forecast_24h.csv', index=False)
    forecast_72h.to_csv('../data/forecast_72h.csv', index=False)
    print("\n✅ Forecasts saved to ../data/")

