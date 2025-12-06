"""
Data preprocessing and feature engineering for AQI forecasting
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import joblib
import os

class AQIDataPreprocessor:
    """Handle data cleaning, feature engineering, and scaling"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.target_column = 'AQI'
        
    def load_data(self, file_path):
        """Load data from CSV file"""
        print(f"Loading data from {file_path}...")
        df = pd.read_csv(file_path)
        df['datetime'] = pd.to_datetime(df['datetime'])
        df = df.sort_values('datetime').reset_index(drop=True)
        print(f"✅ Loaded {len(df)} records")
        return df
    
    def handle_missing_values(self, df):
        """Handle missing values using forward fill and interpolation"""
        print("Handling missing values...")
        initial_missing = df.isnull().sum().sum()
        
        # Forward fill for time series
        df = df.ffill()
        
        # Interpolate remaining missing values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].interpolate(method='linear')
        
        # Fill any remaining with median
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        
        final_missing = df.isnull().sum().sum()
        print(f"✅ Fixed {initial_missing} missing values")
        return df
    
    def create_lag_features(self, df, target_col='AQI', lags=[1, 3, 6, 12, 24]):
        """Create lag features for time series prediction"""
        print(f"Creating lag features: {lags}...")
        df = df.copy()
        
        for lag in lags:
            df[f'{target_col}_lag_{lag}h'] = df[target_col].shift(lag)
        
        # Also create lag features for key pollutants
        for pollutant in ['PM2.5', 'PM10', 'NO2']:
            for lag in [1, 6, 24]:
                df[f'{pollutant}_lag_{lag}h'] = df[pollutant].shift(lag)
        
        print(f"✅ Created {len(lags) * 4} lag features")
        return df
    
    def create_rolling_features(self, df, target_col='AQI', windows=[3, 6, 12, 24]):
        """Create rolling mean and std features"""
        print(f"Creating rolling features: {windows}...")
        df = df.copy()
        
        for window in windows:
            df[f'{target_col}_rolling_mean_{window}h'] = df[target_col].rolling(window=window, min_periods=1).mean()
            df[f'{target_col}_rolling_std_{window}h'] = df[target_col].rolling(window=window, min_periods=1).std()
        
        print(f"✅ Created {len(windows) * 2} rolling features")
        return df
    
    def create_time_features(self, df):
        """Extract time-based features"""
        print("Creating time features...")
        df = df.copy()
        
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek
        df['day_of_month'] = df['datetime'].dt.day
        df['month'] = df['datetime'].dt.month
        df['day_of_year'] = df['datetime'].dt.dayofyear
        
        # Cyclical encoding for time features
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        print("✅ Created time features")
        return df
    
    def create_interaction_features(self, df):
        """Create interaction features between pollutants and weather"""
        print("Creating interaction features...")
        df = df.copy()
        
        # Temperature-pollutant interactions
        df['temp_pm25'] = df['Temperature'] * df['PM2.5']
        df['temp_pm10'] = df['Temperature'] * df['PM10']
        
        # Wind-pollutant interactions
        df['wind_pm25'] = df['Wind Speed'] * df['PM2.5']
        df['wind_pm10'] = df['Wind Speed'] * df['PM10']
        
        # Humidity-pollutant interactions
        df['humidity_pm25'] = df['Humidity'] * df['PM2.5']
        
        # Combined pollutant index
        df['pollutant_index'] = (
            df['PM2.5'] * 0.4 + 
            df['PM10'] * 0.3 + 
            df['NO2'] * 0.15 + 
            df['O3'] * 0.1 + 
            df['SO2'] * 0.05
        )
        
        print("✅ Created interaction features")
        return df
    
    def prepare_features(self, df):
        """Prepare all features for model training"""
        print("\n" + "="*50)
        print("PREPROCESSING DATA")
        print("="*50)
        
        # Handle missing values
        df = self.handle_missing_values(df)
        
        # Create time features
        df = self.create_time_features(df)
        
        # Create lag features
        df = self.create_lag_features(df)
        
        # Create rolling features
        df = self.create_rolling_features(df)
        
        # Create interaction features
        df = self.create_interaction_features(df)
        
        # Drop rows with NaN (from lag features)
        initial_len = len(df)
        df = df.dropna().reset_index(drop=True)
        dropped = initial_len - len(df)
        print(f"✅ Dropped {dropped} rows with NaN from lag features")
        
        print(f"\n✅ Final dataset: {len(df)} records, {len(df.columns)} features")
        return df
    
    def get_feature_columns(self, df):
        """Get list of feature columns (exclude datetime and target)"""
        exclude_cols = ['datetime', self.target_column]
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        return feature_cols
    
    def split_data(self, df, train_ratio=0.7, val_ratio=0.15):
        """Split data into train, validation, and test sets"""
        print("\nSplitting data...")
        n = len(df)
        train_end = int(n * train_ratio)
        val_end = int(n * (train_ratio + val_ratio))
        
        train_df = df.iloc[:train_end].copy()
        val_df = df.iloc[train_end:val_end].copy()
        test_df = df.iloc[val_end:].copy()
        
        print(f"✅ Train: {len(train_df)} ({len(train_df)/n*100:.1f}%)")
        print(f"✅ Validation: {len(val_df)} ({len(val_df)/n*100:.1f}%)")
        print(f"✅ Test: {len(test_df)} ({len(test_df)/n*100:.1f}%)")
        
        return train_df, val_df, test_df
    
    def scale_features(self, train_df, val_df, test_df, feature_cols):
        """Scale features using StandardScaler"""
        print("\nScaling features...")
        
        # Fit scaler on training data
        train_X = train_df[feature_cols].values
        self.scaler.fit(train_X)
        
        # Transform all datasets
        train_X_scaled = self.scaler.transform(train_X)
        val_X_scaled = self.scaler.transform(val_df[feature_cols].values)
        test_X_scaled = self.scaler.transform(test_df[feature_cols].values)
        
        # Get targets
        train_y = train_df[self.target_column].values
        val_y = val_df[self.target_column].values
        test_y = test_df[self.target_column].values
        
        print("✅ Features scaled")
        
        return train_X_scaled, train_y, val_X_scaled, val_y, test_X_scaled, test_y
    
    def save_scaler(self, file_path):
        """Save the scaler for later use"""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        joblib.dump(self.scaler, file_path)
        print(f"✅ Scaler saved to {file_path}")

if __name__ == '__main__':
    # Initialize preprocessor
    preprocessor = AQIDataPreprocessor()
    
    # Load data
    data_path = '../data/aqi_data.csv'
    df = preprocessor.load_data(data_path)
    
    # Prepare features
    df = preprocessor.prepare_features(df)
    
    # Get feature columns
    feature_cols = preprocessor.get_feature_columns(df)
    print(f"\nFeature columns ({len(feature_cols)}):")
    print(feature_cols[:10], "...")
    
    # Split data
    train_df, val_df, test_df = preprocessor.split_data(df)
    
    # Scale features
    train_X, train_y, val_X, val_y, test_X, test_y = preprocessor.scale_features(
        train_df, val_df, test_df, feature_cols
    )
    
    # Save processed data
    os.makedirs('../data/processed', exist_ok=True)
    np.save('../data/processed/train_X.npy', train_X)
    np.save('../data/processed/train_y.npy', train_y)
    np.save('../data/processed/val_X.npy', val_X)
    np.save('../data/processed/val_y.npy', val_y)
    np.save('../data/processed/test_X.npy', test_X)
    np.save('../data/processed/test_y.npy', test_y)
    
    # Save feature columns and scaler
    import json
    with open('../data/processed/feature_columns.json', 'w') as f:
        json.dump(feature_cols, f)
    
    preprocessor.save_scaler('../models/scaler.pkl')
    
    print("\n✅ Preprocessing complete!")
    print("✅ Processed data saved to ../data/processed/")

