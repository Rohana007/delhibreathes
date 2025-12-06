# Quick Start - AQI Forecasting Model

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd aqi-forecasting
pip install pandas numpy scikit-learn tensorflow matplotlib
```

### 2. Run Training Pipeline

```bash
# This will preprocess, train, and evaluate
python train_model.py
```

### 3. Make Predictions

```python
from predict import forecast_next_hour
import pandas as pd

# Load data
df = pd.read_csv('data/aqi_data.csv')
df['datetime'] = pd.to_datetime(df['datetime'])

# Get last 24 hours
recent = df.tail(24)

# Predict
pred = forecast_next_hour(recent)
print(f"Next hour AQI: {pred:.2f}")
```

## 📁 File Structure

```
aqi-forecasting/
├── preprocess.py          # Data preprocessing
├── train_model.py         # Model training
├── predict.py             # Prediction functions
├── data/
│   └── aqi_data.csv       # Your data
└── models/                # Generated after training
    ├── aqi_lstm_model.h5
    ├── scaler_X.pkl
    ├── scaler_y.pkl
    └── feature_columns.pkl
```

## ✅ What's Fixed

- ✅ Proper data normalization (MinMaxScaler)
- ✅ Outlier removal (IQR method)
- ✅ Correct sequence creation (24-hour windows)
- ✅ Stacked LSTM with dropout
- ✅ Learning rate optimization
- ✅ Comprehensive debugging
- ✅ Dynamic predictions (not constant!)

## 🔍 Verify It's Working

After training, check:
1. **Training plots** in `models/training_history.png` - loss should decrease
2. **Prediction plots** in `models/predictions_vs_actual.png` - should follow actual
3. **Console output** - prediction variance should be > 1.0
4. **First 20 predictions** - should vary, not be constant

## ⚠️ Troubleshooting

**If predictions are still constant:**
1. Check data variance: `np.var(y_train)` should be > 0.01
2. Check training loss is decreasing
3. Increase model capacity (more LSTM units)
4. Verify your data has variation

## 📊 Expected Results

- **MAE**: ~10-20 (depends on data)
- **RMSE**: ~15-30
- **R²**: > 0.7
- **Prediction variance**: Should match actual variance

## 🎯 Next Steps

1. Train: `python train_model.py`
2. Check plots in `models/` folder
3. Use `forecast_next_hour()` in your API
4. Tune hyperparameters if needed

