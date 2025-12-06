# AQI Forecasting System - Setup Guide

## 📋 Prerequisites

- Python 3.8 or higher
- pip package manager
- 4GB+ RAM recommended
- 2GB+ disk space for models

## 🚀 Installation Steps

### 1. Navigate to Project Directory

```bash
cd delhi-breathes/aqi-forecasting
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note:** If you encounter issues with TensorFlow, you can install it separately:

```bash
pip install tensorflow
```

### 3. Train Models

Run the training script to:
- Generate sample data (if not exists)
- Preprocess and engineer features
- Train Random Forest, XGBoost, and LSTM models
- Evaluate and select the best model
- Save models to `models/` directory

```bash
python train_model.py
```

**Expected Output:**
- ✅ Generated sample data
- ✅ Preprocessing complete
- ✅ Models trained (Random Forest, XGBoost, LSTM)
- ✅ Best model selected
- ✅ Models saved to `models/`

**Training Time:** 
- Random Forest: ~2-5 minutes
- XGBoost: ~3-7 minutes
- LSTM: ~10-20 minutes (depending on hardware)

### 4. Start API Server

```bash
python run_api.py
```

The API will start at `http://localhost:8000`

## 📡 API Usage

### Health Check

```bash
curl http://localhost:8000/health
```

### Get 24-Hour Forecast (GET)

```bash
curl http://localhost:8000/predict/24h
```

### Get 72-Hour Forecast (GET)

```bash
curl http://localhost:8000/predict/72h
```

### Post 24-Hour Forecast (POST - with custom data)

```bash
curl -X POST "http://localhost:8000/predict/24h" \
  -H "Content-Type: application/json" \
  -d '{
    "historical_data": [
      {
        "datetime": "2024-01-01T00:00:00",
        "AQI": 150,
        "PM2_5": 60,
        "PM10": 90,
        "NO2": 30,
        "SO2": 15,
        "CO": 2.5,
        "O3": 50,
        "Temperature": 25.0,
        "Humidity": 50.0,
        "Wind_Speed": 5.0,
        "Wind_Direction": 180.0
      }
    ]
  }'
```

## 📁 Project Structure

```
aqi-forecasting/
├── data/
│   ├── generate_sample_data.py    # Generate synthetic AQI data
│   ├── aqi_data.csv                # Historical AQI data (generated)
│   └── processed/                  # Preprocessed data (created after training)
│       ├── train_X.npy
│       ├── train_y.npy
│       ├── val_X.npy
│       ├── val_y.npy
│       ├── test_X.npy
│       ├── test_y.npy
│       └── feature_columns.json
├── scripts/
│   ├── preprocess_data.py          # Data preprocessing & feature engineering
│   ├── train_models.py             # Model training script
│   └── forecast.py                 # Forecasting script
├── api/
│   └── main.py                     # FastAPI server
├── models/                          # Trained models (created after training)
│   ├── random_forest.pkl
│   ├── xgboost.pkl
│   ├── lstm_best.h5
│   ├── scaler.pkl
│   └── best_model.json
├── requirements.txt                # Python dependencies
├── train_model.py                   # Main training script
├── run_api.py                       # API server launcher
├── example_usage.py                 # Example usage script
├── README.md                        # Project documentation
└── SETUP.md                         # This file
```

## 🔧 Troubleshooting

### Issue: "Module not found" errors

**Solution:** Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: "Model not found" when running API

**Solution:** Train models first:
```bash
python train_model.py
```

### Issue: TensorFlow installation fails

**Solution:** Install TensorFlow separately:
```bash
pip install tensorflow
```

Or for CPU-only version:
```bash
pip install tensorflow-cpu
```

### Issue: Out of memory during LSTM training

**Solution:** Reduce batch size in `scripts/train_models.py`:
```python
batch_size=16  # Instead of 32
```

### Issue: API returns 503 error

**Solution:** Check that models are trained and in the `models/` directory. Verify the forecaster initialized successfully in the API logs.

## 📊 Model Performance

After training, check `models/best_model.json` for:
- Best model name
- Validation metrics (MAE, RMSE, R²)

## 🎯 Next Steps

1. **Use Your Own Data:** Replace `data/aqi_data.csv` with your historical AQI data
2. **Customize Models:** Edit `scripts/train_models.py` to adjust hyperparameters
3. **Deploy API:** Use production WSGI server like Gunicorn for deployment
4. **Monitor Performance:** Add logging and monitoring to track forecast accuracy

## 📝 Notes

- Sample data is automatically generated if `data/aqi_data.csv` doesn't exist
- Models are saved in `models/` directory after training
- The best model is automatically selected based on validation RMSE
- API supports both GET (simple) and POST (with custom data) endpoints

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the README.md for detailed documentation
3. Check API logs for error messages
4. Verify all files are in the correct directories
