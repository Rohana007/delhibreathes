# AQI Forecasting Model - Training Guide

## Problem Fixed

The model was outputting constant values (160-161) because:
1. ❌ Data wasn't properly normalized
2. ❌ Sequences weren't created correctly
3. ❌ Model wasn't learning (low variance in predictions)
4. ❌ Missing outlier removal and proper preprocessing

## Solution

✅ **Complete preprocessing pipeline** with:
- Proper datetime conversion and sorting
- Missing value interpolation
- IQR-based outlier removal
- MinMaxScaler normalization
- Proper sequence creation (24-hour windows)

✅ **Improved LSTM model** with:
- Stacked LSTM layers (128 → 64)
- Dropout regularization (0.2)
- Proper learning rate (0.0005)
- Early stopping and learning rate reduction

✅ **Comprehensive debugging**:
- Variance checks before/after scaling
- Training history plots
- Prediction vs actual plots
- First 20 predictions printed

## Files Created

1. **`preprocess.py`** - Data preprocessing and sequence creation
2. **`train_model.py`** - Model training with debugging
3. **`predict.py`** - Prediction functions

## How to Run

### Step 1: Install Dependencies

```bash
pip install pandas numpy scikit-learn tensorflow matplotlib
```

### Step 2: Preprocess Data

```bash
python preprocess.py
```

This will:
- Load `data/aqi_data.csv`
- Clean and preprocess data
- Create sequences
- Save scalers to `models/`

### Step 3: Train Model

```bash
python train_model.py
```

This will:
- Build LSTM model
- Train for up to 80 epochs
- Save best model to `models/aqi_lstm_model.h5`
- Generate training plots
- Evaluate on test set

### Step 4: Make Predictions

```python
from predict import forecast_next_hour
import pandas as pd

# Load historical data
df = pd.read_csv('data/aqi_data.csv')
df['datetime'] = pd.to_datetime(df['datetime'])

# Get last 24 hours
recent = df.tail(24)

# Forecast next hour
prediction = forecast_next_hour(recent)
print(f"Predicted AQI: {prediction:.2f}")
```

Or use the class:

```python
from predict import AQIForecaster

forecaster = AQIForecaster()
prediction = forecaster.forecast_next_hour(recent_data)
```

## Expected Output

### During Training

```
✅ Loaded 8760 records
✅ Fixed missing values
✅ Processed outliers
✅ Created features
✅ Created sequences: (8736, 24, 45)
📊 Training with:
   Epochs: 80
   Batch size: 32
   Training samples: 6115
   Validation samples: 874
```

### After Training

```
📊 Test Set Metrics:
   MAE: 12.34
   RMSE: 18.56
   R²: 0.8234

📊 Prediction Statistics:
   Prediction variance: 456.78
   Actual variance: 512.34
   Prediction range: [85.23, 245.67]
```

## Debugging Features

The code includes extensive debugging:

1. **Variance Checks**: Warns if data is almost constant
2. **Training Plots**: `models/training_history.png`
3. **Prediction Plots**: `models/predictions_vs_actual.png`
4. **First 20 Predictions**: Printed to console
5. **Model Summary**: Architecture printed

## Key Improvements

1. **Proper Scaling**: Separate scalers for X and y
2. **Outlier Handling**: IQR method with capping (preserves time series)
3. **Sequence Creation**: Correct sliding window format
4. **Model Architecture**: Stacked LSTM with dropout
5. **Learning Rate**: Optimized to 0.0005
6. **Callbacks**: Early stopping + LR reduction

## Troubleshooting

### If predictions are still constant:

1. **Check data variance**:
   ```python
   print(f"y_train variance: {np.var(y_train)}")
   ```
   Should be > 0.01

2. **Check model is learning**:
   - Look at training history plot
   - Loss should decrease
   - Val loss should follow train loss

3. **Check predictions variance**:
   ```python
   print(f"Prediction variance: {np.var(predictions)}")
   ```
   Should match actual variance

4. **Increase model capacity**:
   - Increase LSTM units (128 → 256)
   - Add more layers
   - Reduce dropout

5. **Check data quality**:
   - Ensure AQI values vary significantly
   - Check for data leakage
   - Verify features are informative

## Model Files

After training, you'll have:
- `models/aqi_lstm_model.h5` - Trained model
- `models/scaler_X.pkl` - Feature scaler
- `models/scaler_y.pkl` - Target scaler
- `models/feature_columns.pkl` - Feature names
- `models/training_history.png` - Training plots
- `models/predictions_vs_actual.png` - Prediction plots

## Next Steps

1. **Hyperparameter Tuning**: Adjust learning rate, batch size, model architecture
2. **Feature Engineering**: Add more features (weather forecasts, seasonality)
3. **Ensemble Methods**: Combine multiple models
4. **Production Deployment**: Use `forecast_next_hour()` in your API

## Notes

- Model requires at least 24 hours of historical data
- Predictions are clipped to valid AQI range (0-500)
- Model uses last 24 hours to predict next hour
- For multi-hour forecasts, predictions are iterative (uses previous predictions)

