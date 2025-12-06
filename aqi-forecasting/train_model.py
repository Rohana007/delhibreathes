"""
Train LSTM model for AQI forecasting
"""
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import matplotlib.pyplot as plt
import os
from preprocess import AQIPreprocessor

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

def build_model(input_shape):
    """Build stacked LSTM model"""
    print("\n" + "="*60)
    print("BUILDING LSTM MODEL")
    print("="*60)
    
    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(64, return_sequences=False),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(1)
    ])
    
    # Compile model
    optimizer = Adam(learning_rate=0.0005)
    model.compile(
        optimizer=optimizer,
        loss='mse',
        metrics=['mae']
    )
    
    print("\nModel Architecture:")
    model.summary()
    
    return model

def train_model(X_train, y_train, X_val, y_val, epochs=80, batch_size=32):
    """Train the LSTM model"""
    print("\n" + "="*60)
    print("TRAINING MODEL")
    print("="*60)
    
    # Build model
    input_shape = (X_train.shape[1], X_train.shape[2])
    model = build_model(input_shape)
    
    # Callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            patience=5,
            factor=0.5,
            min_lr=1e-7,
            verbose=1
        ),
        ModelCheckpoint(
            'models/aqi_lstm_model.h5',
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        )
    ]
    
    # Train model
    print(f"\nTraining with:")
    print(f"   Epochs: {epochs}")
    print(f"   Batch size: {batch_size}")
    print(f"   Validation split: 20%")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Validation samples: {len(X_val)}")
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=1
    )
    
    # Plot training history
    plot_training_history(history)
    
    return model, history

def plot_training_history(history):
    """Plot training loss and MAE"""
    print("\n📊 Plotting training history...")
    
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    
    # Loss
    axes[0].plot(history.history['loss'], label='Train Loss')
    axes[0].plot(history.history['val_loss'], label='Val Loss')
    axes[0].set_title('Model Loss')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss (MSE)')
    axes[0].legend()
    axes[0].grid(True)
    
    # MAE
    axes[1].plot(history.history['mae'], label='Train MAE')
    axes[1].plot(history.history['val_mae'], label='Val MAE')
    axes[1].set_title('Model MAE')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('MAE')
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.savefig('models/training_history.png', dpi=150, bbox_inches='tight')
    print("✅ Saved training history plot to models/training_history.png")
    plt.close()

def evaluate_model(model, X_test, y_test, scaler_y):
    """Evaluate model and plot predictions"""
    print("\n" + "="*60)
    print("EVALUATING MODEL")
    print("="*60)
    
    # Predictions
    y_pred_scaled = model.predict(X_test, verbose=0)
    
    # Inverse transform
    y_pred = scaler_y.inverse_transform(y_pred_scaled)
    y_actual = scaler_y.inverse_transform(y_test.reshape(-1, 1))
    
    # Calculate metrics
    mae = np.mean(np.abs(y_actual - y_pred))
    rmse = np.sqrt(np.mean((y_actual - y_pred) ** 2))
    
    # R² score
    ss_res = np.sum((y_actual - y_pred) ** 2)
    ss_tot = np.sum((y_actual - np.mean(y_actual)) ** 2)
    r2 = 1 - (ss_res / ss_tot)
    
    print(f"\n📊 Test Set Metrics:")
    print(f"   MAE: {mae:.2f}")
    print(f"   RMSE: {rmse:.2f}")
    print(f"   R²: {r2:.4f}")
    
    # Print first 20 predictions vs actual
    print(f"\n📋 First 20 Predictions vs Actual:")
    print(f"{'Index':<8} {'Predicted':<12} {'Actual':<12} {'Error':<12}")
    print("-" * 50)
    for i in range(min(20, len(y_pred))):
        error = abs(y_actual[i][0] - y_pred[i][0])
        print(f"{i:<8} {y_pred[i][0]:<12.2f} {y_actual[i][0]:<12.2f} {error:<12.2f}")
    
    # Check prediction variance
    pred_variance = np.var(y_pred)
    actual_variance = np.var(y_actual)
    
    print(f"\n📊 Prediction Statistics:")
    print(f"   Prediction variance: {pred_variance:.2f}")
    print(f"   Actual variance: {actual_variance:.2f}")
    print(f"   Prediction range: [{np.min(y_pred):.2f}, {np.max(y_pred):.2f}]")
    print(f"   Actual range: [{np.min(y_actual):.2f}, {np.max(y_actual):.2f}]")
    
    if pred_variance < 1.0:
        print("⚠️  WARNING: Prediction variance is very low. Model may be predicting constant values!")
    
    # Plot predictions vs actual
    plot_predictions(y_actual, y_pred)
    
    return {
        'mae': mae,
        'rmse': rmse,
        'r2': r2,
        'y_pred': y_pred,
        'y_actual': y_actual
    }

def plot_predictions(y_actual, y_pred):
    """Plot predictions vs actual values"""
    print("\n📊 Plotting predictions vs actual...")
    
    # Take a sample for visualization (first 200 points)
    n_samples = min(200, len(y_actual))
    y_actual_sample = y_actual[:n_samples].flatten()
    y_pred_sample = y_pred[:n_samples].flatten()
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Time series plot
    axes[0].plot(y_actual_sample, label='Actual', alpha=0.7, linewidth=2)
    axes[0].plot(y_pred_sample, label='Predicted', alpha=0.7, linewidth=2)
    axes[0].set_title('Predictions vs Actual (First 200 samples)')
    axes[0].set_xlabel('Sample Index')
    axes[0].set_ylabel('AQI')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)
    
    # Scatter plot
    axes[1].scatter(y_actual_sample, y_pred_sample, alpha=0.5, s=20)
    min_val = min(np.min(y_actual_sample), np.min(y_pred_sample))
    max_val = max(np.max(y_actual_sample), np.max(y_pred_sample))
    axes[1].plot([min_val, max_val], [min_val, max_val], 'r--', linewidth=2, label='Perfect Prediction')
    axes[1].set_title('Predicted vs Actual (Scatter)')
    axes[1].set_xlabel('Actual AQI')
    axes[1].set_ylabel('Predicted AQI')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('models/predictions_vs_actual.png', dpi=150, bbox_inches='tight')
    print("✅ Saved predictions plot to models/predictions_vs_actual.png")
    plt.close()

def main():
    """Main training pipeline"""
    print("="*60)
    print("AQI FORECASTING - LSTM MODEL TRAINING")
    print("="*60)
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Preprocess data
    preprocessor = AQIPreprocessor()
    data = preprocessor.preprocess('data/aqi_data.csv', window_size=24)
    
    # Save scalers
    preprocessor.save_scalers('models')
    
    # Train model
    model, history = train_model(
        data['X_train'],
        data['y_train'],
        data['X_val'],
        data['y_val'],
        epochs=80,
        batch_size=32
    )
    
    # Evaluate model
    metrics = evaluate_model(
        model,
        data['X_test'],
        data['y_test'],
        preprocessor.scaler_y
    )
    
    # Save final model
    model.save('models/aqi_lstm_model.h5')
    print("\n✅ Saved model to models/aqi_lstm_model.h5")
    
    print("\n" + "="*60)
    print("✅ TRAINING COMPLETE!")
    print("="*60)
    print(f"\nFinal Test Metrics:")
    print(f"   MAE: {metrics['mae']:.2f}")
    print(f"   RMSE: {metrics['rmse']:.2f}")
    print(f"   R²: {metrics['r2']:.4f}")

if __name__ == '__main__':
    main()
