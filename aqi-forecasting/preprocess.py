"""
Data preprocessing for AQI forecasting
Handles cleaning, outlier removal, normalization, and sequence creation
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import pickle
import os
import warnings
warnings.filterwarnings('ignore')

class AQIPreprocessor:
    """Preprocess AQI data for LSTM training"""
    
    def __init__(self):
        self.scaler_X = MinMaxScaler()
        self.scaler_y = MinMaxScaler()
        self.feature_columns = None
        
    def load_data(self, csv_path):
        """Load CSV and convert datetime"""
        print(f"Loading data from {csv_path}...")
        df = pd.read_csv(csv_path)
        
        # Convert datetime
        df['datetime'] = pd.to_datetime(df['datetime'])
        
        # Sort by date
        df = df.sort_values('datetime').reset_index(drop=True)
        
        print(f"✅ Loaded {len(df)} records")
        print(f"Date range: {df['datetime'].min()} to {df['datetime'].max()}")
        return df
    
    def fill_missing_values(self, df):
        """Fill missing values using interpolation"""
        print("\nFilling missing values...")
        initial_missing = df.isnull().sum().sum()
        
        # Get numeric columns (excluding datetime)
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Forward fill first (for time series)
        df[numeric_cols] = df[numeric_cols].ffill()
        
        # Then backward fill
        df[numeric_cols] = df[numeric_cols].bfill()
        
        # Interpolate remaining
        df[numeric_cols] = df[numeric_cols].interpolate(method='linear', limit_direction='both')
        
        # Fill any remaining with median
        for col in numeric_cols:
            if df[col].isnull().sum() > 0:
                df[col].fillna(df[col].median(), inplace=True)
        
        final_missing = df.isnull().sum().sum()
        print(f"✅ Fixed {initial_missing} missing values (remaining: {final_missing})")
        return df
    
    def remove_outliers_iqr(self, df):
        """Remove outliers using IQR method"""
        print("\nRemoving outliers using IQR...")
        initial_len = len(df)
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Remove datetime and AQI from outlier removal (we'll handle AQI separately)
        if 'AQI' in numeric_cols:
            numeric_cols.remove('AQI')
        
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            # Cap outliers instead of removing (to preserve time series continuity)
            df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
        
        # Handle AQI separately (clip to valid range 0-500)
        if 'AQI' in df.columns:
            df['AQI'] = df['AQI'].clip(lower=0, upper=500)
        
        removed = initial_len - len(df)
        print(f"✅ Processed outliers (capped extreme values)")
        print(f"   Data points: {initial_len} → {len(df)}")
        return df
    
    def create_features(self, df):
        """Create time-based and lag features"""
        print("\nCreating features...")
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
        
        # Drop rows with NaN from lag features
        initial_len = len(df)
        df = df.dropna().reset_index(drop=True)
        dropped = initial_len - len(df)
        print(f"✅ Created features, dropped {dropped} rows with NaN")
        
        return df
    
    def normalize_features(self, df, fit=True):
        """Normalize features using MinMaxScaler"""
        print("\nNormalizing features...")
        
        # Separate target and features
        target_col = 'AQI'
        feature_cols = [col for col in df.columns if col not in ['datetime', target_col]]
        self.feature_columns = feature_cols
        
        X = df[feature_cols].values
        y = df[target_col].values.reshape(-1, 1)
        
        # Print variance before scaling
        print(f"   X variance before scaling: {np.var(X):.4f}")
        print(f"   y variance before scaling: {np.var(y):.4f}")
        print(f"   y mean: {np.mean(y):.2f}, std: {np.std(y):.2f}")
        print(f"   y range: [{np.min(y):.2f}, {np.max(y):.2f}]")
        
        if fit:
            # Fit scalers
            X_scaled = self.scaler_X.fit_transform(X)
            y_scaled = self.scaler_y.fit_transform(y)
        else:
            # Transform only
            X_scaled = self.scaler_X.transform(X)
            y_scaled = self.scaler_y.transform(y)
        
        # Print variance after scaling
        print(f"   X variance after scaling: {np.var(X_scaled):.4f}")
        print(f"   y variance after scaling: {np.var(y_scaled):.4f}")
        
        # Check if data is almost constant
        if np.var(y_scaled) < 0.01:
            print("⚠️  WARNING: Target variance is very low (< 0.01). Data may be almost constant!")
        if np.var(X_scaled) < 0.01:
            print("⚠️  WARNING: Feature variance is very low (< 0.01). Features may be almost constant!")
        
        return X_scaled, y_scaled.flatten()
    
    def create_sequences(self, X, y, window_size=24):
        """Create sliding window sequences for LSTM"""
        print(f"\nCreating sequences with window_size={window_size}...")
        
        X_seq, y_seq = [], []
        
        for i in range(len(X) - window_size + 1):
            X_seq.append(X[i:i+window_size])
            y_seq.append(y[i+window_size-1])  # Predict next hour after window
        
        X_seq = np.array(X_seq)
        y_seq = np.array(y_seq)
        
        print(f"✅ Created sequences:")
        print(f"   X shape: {X_seq.shape} (samples, timesteps, features)")
        print(f"   y shape: {y_seq.shape} (samples,)")
        
        return X_seq, y_seq
    
    def preprocess(self, csv_path, window_size=24, test_size=0.2, val_size=0.1):
        """Complete preprocessing pipeline"""
        print("="*60)
        print("AQI DATA PREPROCESSING")
        print("="*60)
        
        # Load data
        df = self.load_data(csv_path)
        
        # Fill missing values
        df = self.fill_missing_values(df)
        
        # Remove outliers
        df = self.remove_outliers_iqr(df)
        
        # Create features
        df = self.create_features(df)
        
        # Normalize
        X, y = self.normalize_features(df, fit=True)
        
        # Create sequences
        X_seq, y_seq = self.create_sequences(X, y, window_size)
        
        # Split data
        n_samples = len(X_seq)
        n_test = int(n_samples * test_size)
        n_val = int(n_samples * val_size)
        n_train = n_samples - n_test - n_val
        
        # Time series split (preserve temporal order)
        X_train = X_seq[:n_train]
        y_train = y_seq[:n_train]
        X_val = X_seq[n_train:n_train+n_val]
        y_val = y_seq[n_train:n_train+n_val]
        X_test = X_seq[n_train+n_val:]
        y_test = y_seq[n_train+n_val:]
        
        print(f"\n✅ Data split:")
        print(f"   Train: {len(X_train)} samples")
        print(f"   Val: {len(X_val)} samples")
        print(f"   Test: {len(X_test)} samples")
        
        # Print data statistics
        print(f"\n📊 Data Statistics:")
        print(f"   y_train variance: {np.var(y_train):.6f}")
        print(f"   y_train mean: {np.mean(y_train):.4f}, std: {np.std(y_train):.4f}")
        print(f"   y_train range: [{np.min(y_train):.4f}, {np.max(y_train):.4f}]")
        
        if np.var(y_train) < 0.01:
            print("⚠️  WARNING: Training target variance < 0.01. Model may predict constant values!")
        
        return {
            'X_train': X_train,
            'y_train': y_train,
            'X_val': X_val,
            'y_val': y_val,
            'X_test': X_test,
            'y_test': y_test,
            'feature_columns': self.feature_columns
        }
    
    def save_scalers(self, save_dir='models'):
        """Save scalers for later use"""
        os.makedirs(save_dir, exist_ok=True)
        
        with open(os.path.join(save_dir, 'scaler_X.pkl'), 'wb') as f:
            pickle.dump(self.scaler_X, f)
        
        with open(os.path.join(save_dir, 'scaler_y.pkl'), 'wb') as f:
            pickle.dump(self.scaler_y, f)
        
        with open(os.path.join(save_dir, 'feature_columns.pkl'), 'wb') as f:
            pickle.dump(self.feature_columns, f)
        
        print(f"✅ Saved scalers to {save_dir}/")

if __name__ == '__main__':
    # Example usage
    preprocessor = AQIPreprocessor()
    data = preprocessor.preprocess('data/aqi_data.csv', window_size=24)
    preprocessor.save_scalers('models')

