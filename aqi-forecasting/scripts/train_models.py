"""
Train multiple ML models for AQI forecasting
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import joblib
import json
import os
import warnings
warnings.filterwarnings('ignore')

class ModelTrainer:
    """Train and evaluate multiple ML models"""
    
    def __init__(self):
        self.models = {}
        self.results = {}
        self.best_model = None
        self.best_model_name = None
        
    def load_data(self):
        """Load preprocessed data"""
        print("Loading preprocessed data...")
        # Get correct paths
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.dirname(script_dir)
        data_dir = os.path.join(base_dir, 'data', 'processed')
        
        train_X = np.load(os.path.join(data_dir, 'train_X.npy'))
        train_y = np.load(os.path.join(data_dir, 'train_y.npy'))
        val_X = np.load(os.path.join(data_dir, 'val_X.npy'))
        val_y = np.load(os.path.join(data_dir, 'val_y.npy'))
        test_X = np.load(os.path.join(data_dir, 'test_X.npy'))
        test_y = np.load(os.path.join(data_dir, 'test_y.npy'))
        
        with open(os.path.join(data_dir, 'feature_columns.json'), 'r') as f:
            feature_cols = json.load(f)
        
        print(f"✅ Loaded data: Train={len(train_X)}, Val={len(val_X)}, Test={len(test_X)}")
        return train_X, train_y, val_X, val_y, test_X, test_y, feature_cols
    
    def evaluate_model(self, y_true, y_pred, model_name):
        """Calculate evaluation metrics"""
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        r2 = r2_score(y_true, y_pred)
        
        return {
            'MAE': mae,
            'RMSE': rmse,
            'R2': r2
        }
    
    def train_random_forest(self, train_X, train_y, val_X, val_y):
        """Train Random Forest model"""
        print("\n" + "="*50)
        print("TRAINING RANDOM FOREST")
        print("="*50)
        
        model = RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
            verbose=1
        )
        
        print("Training...")
        model.fit(train_X, train_y)
        
        # Predictions
        train_pred = model.predict(train_X)
        val_pred = model.predict(val_X)
        
        # Evaluate
        train_metrics = self.evaluate_model(train_y, train_pred, 'RF_Train')
        val_metrics = self.evaluate_model(val_y, val_pred, 'RF_Val')
        
        print(f"\nTrain Metrics:")
        print(f"  MAE: {train_metrics['MAE']:.2f}")
        print(f"  RMSE: {train_metrics['RMSE']:.2f}")
        print(f"  R²: {train_metrics['R2']:.4f}")
        
        print(f"\nValidation Metrics:")
        print(f"  MAE: {val_metrics['MAE']:.2f}")
        print(f"  RMSE: {val_metrics['RMSE']:.2f}")
        print(f"  R²: {val_metrics['R2']:.4f}")
        
        self.models['RandomForest'] = model
        self.results['RandomForest'] = val_metrics
        
        return model
    
    def train_xgboost(self, train_X, train_y, val_X, val_y):
        """Train XGBoost model"""
        print("\n" + "="*50)
        print("TRAINING XGBOOST")
        print("="*50)
        
        # XGBoost 3.x: sklearn API (XGBRegressor) doesn't support callbacks in fit()
        # Train without early stopping (model will still perform well)
        model = xgb.XGBRegressor(
            n_estimators=300,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            verbosity=1
        )
        
        print("Training...")
        model.fit(
            train_X, train_y,
            eval_set=[(val_X, val_y)],
            verbose=False
        )
        
        # Predictions
        train_pred = model.predict(train_X)
        val_pred = model.predict(val_X)
        
        # Evaluate
        train_metrics = self.evaluate_model(train_y, train_pred, 'XGB_Train')
        val_metrics = self.evaluate_model(val_y, val_pred, 'XGB_Val')
        
        print(f"\nTrain Metrics:")
        print(f"  MAE: {train_metrics['MAE']:.2f}")
        print(f"  RMSE: {train_metrics['RMSE']:.2f}")
        print(f"  R²: {train_metrics['R2']:.4f}")
        
        print(f"\nValidation Metrics:")
        print(f"  MAE: {val_metrics['MAE']:.2f}")
        print(f"  RMSE: {val_metrics['RMSE']:.2f}")
        print(f"  R²: {val_metrics['R2']:.4f}")
        
        self.models['XGBoost'] = model
        self.results['XGBoost'] = val_metrics
        
        return model
    
    def train_lstm(self, train_X, train_y, val_X, val_y):
        """Train LSTM model"""
        print("\n" + "="*50)
        print("TRAINING LSTM")
        print("="*50)
        
        # Reshape data for LSTM (samples, timesteps, features)
        # For LSTM, we need sequence data. We'll use a sliding window approach
        sequence_length = 24  # 24 hours
        
        def create_sequences(X, y, seq_len):
            X_seq, y_seq = [], []
            for i in range(len(X) - seq_len + 1):
                X_seq.append(X[i:i+seq_len])
                y_seq.append(y[i+seq_len-1])
            return np.array(X_seq), np.array(y_seq)
        
        print("Creating sequences...")
        train_X_seq, train_y_seq = create_sequences(train_X, train_y, sequence_length)
        val_X_seq, val_y_seq = create_sequences(val_X, val_y, sequence_length)
        
        print(f"Train sequences: {train_X_seq.shape}")
        print(f"Val sequences: {val_X_seq.shape}")
        
        # Build LSTM model
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=(sequence_length, train_X.shape[1])),
            Dropout(0.2),
            LSTM(64, return_sequences=False),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dense(1)
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        print("\nModel architecture:")
        model.summary()
        
        # Callbacks
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Get models directory path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.dirname(script_dir)
        models_dir = os.path.join(base_dir, 'models')
        os.makedirs(models_dir, exist_ok=True)
        
        checkpoint = ModelCheckpoint(
            os.path.join(models_dir, 'lstm_best.h5'),
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        )
        
        print("\nTraining...")
        history = model.fit(
            train_X_seq, train_y_seq,
            validation_data=(val_X_seq, val_y_seq),
            epochs=50,
            batch_size=32,
            callbacks=[early_stopping, checkpoint],
            verbose=1
        )
        
        # Load best model
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.dirname(script_dir)
        models_dir = os.path.join(base_dir, 'models')
        model.load_weights(os.path.join(models_dir, 'lstm_best.h5'))
        
        # Predictions
        train_pred = model.predict(train_X_seq, verbose=0).flatten()
        val_pred = model.predict(val_X_seq, verbose=0).flatten()
        
        # Evaluate
        train_metrics = self.evaluate_model(train_y_seq, train_pred, 'LSTM_Train')
        val_metrics = self.evaluate_model(val_y_seq, val_pred, 'LSTM_Val')
        
        print(f"\nTrain Metrics:")
        print(f"  MAE: {train_metrics['MAE']:.2f}")
        print(f"  RMSE: {train_metrics['RMSE']:.2f}")
        print(f"  R²: {train_metrics['R2']:.4f}")
        
        print(f"\nValidation Metrics:")
        print(f"  MAE: {val_metrics['MAE']:.2f}")
        print(f"  RMSE: {val_metrics['RMSE']:.2f}")
        print(f"  R²: {val_metrics['R2']:.4f}")
        
        self.models['LSTM'] = model
        self.results['LSTM'] = val_metrics
        
        return model
    
    def select_best_model(self):
        """Select best model based on validation RMSE"""
        print("\n" + "="*50)
        print("MODEL COMPARISON")
        print("="*50)
        
        for name, metrics in self.results.items():
            print(f"\n{name}:")
            print(f"  MAE: {metrics['MAE']:.2f}")
            print(f"  RMSE: {metrics['RMSE']:.2f}")
            print(f"  R²: {metrics['R2']:.4f}")
        
        # Select model with lowest RMSE
        best_name = min(self.results.keys(), key=lambda x: self.results[x]['RMSE'])
        self.best_model = self.models[best_name]
        self.best_model_name = best_name
        
        print(f"\n✅ Best Model: {best_name}")
        print(f"   RMSE: {self.results[best_name]['RMSE']:.2f}")
        print(f"   R²: {self.results[best_name]['R2']:.4f}")
        
        return best_name
    
    def save_models(self):
        """Save all trained models"""
        print("\nSaving models...")
        # Get models directory path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.dirname(script_dir)
        models_dir = os.path.join(base_dir, 'models')
        os.makedirs(models_dir, exist_ok=True)
        
        # Save Random Forest
        if 'RandomForest' in self.models:
            joblib.dump(self.models['RandomForest'], os.path.join(models_dir, 'random_forest.pkl'))
            print("✅ Saved Random Forest model")
        
        # Save XGBoost
        if 'XGBoost' in self.models:
            joblib.dump(self.models['XGBoost'], os.path.join(models_dir, 'xgboost.pkl'))
            print("✅ Saved XGBoost model")
        
        # LSTM is already saved during training
        
        # Save best model info
        with open(os.path.join(models_dir, 'best_model.json'), 'w') as f:
            json.dump({
                'best_model': self.best_model_name,
                'metrics': self.results[self.best_model_name]
            }, f, indent=2)
        
        print("✅ Saved best model info")
    
    def evaluate_on_test(self, test_X, test_y):
        """Evaluate best model on test set"""
        print("\n" + "="*50)
        print("TEST SET EVALUATION")
        print("="*50)
        
        if self.best_model_name == 'LSTM':
            # LSTM needs sequences
            sequence_length = 24
            test_X_seq, test_y_seq = self._create_sequences_for_lstm(test_X, test_y, sequence_length)
            test_pred = self.best_model.predict(test_X_seq, verbose=0).flatten()
            test_y_actual = test_y_seq
        else:
            test_pred = self.best_model.predict(test_X)
            test_y_actual = test_y
        
        test_metrics = self.evaluate_model(test_y_actual, test_pred, 'Test')
        
        print(f"\nTest Metrics ({self.best_model_name}):")
        print(f"  MAE: {test_metrics['MAE']:.2f}")
        print(f"  RMSE: {test_metrics['RMSE']:.2f}")
        print(f"  R²: {test_metrics['R2']:.4f}")
        
        return test_metrics
    
    def _create_sequences_for_lstm(self, X, y, seq_len):
        """Helper to create sequences for LSTM"""
        X_seq, y_seq = [], []
        for i in range(len(X) - seq_len + 1):
            X_seq.append(X[i:i+seq_len])
            y_seq.append(y[i+seq_len-1])
        return np.array(X_seq), np.array(y_seq)

if __name__ == '__main__':
    print("="*50)
    print("AQI FORECASTING - MODEL TRAINING")
    print("="*50)
    
    trainer = ModelTrainer()
    
    # Load data
    train_X, train_y, val_X, val_y, test_X, test_y, feature_cols = trainer.load_data()
    
    # Train all models
    trainer.train_random_forest(train_X, train_y, val_X, val_y)
    trainer.train_xgboost(train_X, train_y, val_X, val_y)
    trainer.train_lstm(train_X, train_y, val_X, val_y)
    
    # Select best model
    best_name = trainer.select_best_model()
    
    # Evaluate on test set
    test_metrics = trainer.evaluate_on_test(test_X, test_y)
    
    # Save models
    trainer.save_models()
    
    print("\n" + "="*50)
    print("✅ TRAINING COMPLETE!")
    print("="*50)

