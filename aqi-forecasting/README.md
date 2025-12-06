# AQI Forecasting System

A complete Python-based machine learning system for forecasting Air Quality Index (AQI) with 24-hour and 72-hour predictions.

## 🎯 Features

- **Multiple ML Models**: Random Forest, XGBoost, and LSTM
- **24-hour & 72-hour Forecasts**: Hour-by-hour predictions
- **REST API**: FastAPI-based API for predictions
- **Auto Model Selection**: Automatically selects best performing model
- **Production Ready**: Complete pipeline from data to deployment

## 📁 Project Structure

```
aqi-forecasting/
├── data/
│   ├── generate_sample_data.py    # Generate synthetic AQI data
│   ├── aqi_data.csv                # Historical AQI data
│   └── processed/                  # Preprocessed data
├── scripts/
│   ├── preprocess_data.py          # Data preprocessing & feature engineering
│   ├── train_models.py             # Model training script
│   └── forecast.py                 # Forecasting script
├── api/
│   └── main.py                     # FastAPI server
├── models/                          # Trained models (created after training)
├── requirements.txt                 # Python dependencies
├── train_model.py                   # Main training script
├── run_api.py                       # API server launcher
└── README.md                        # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd aqi-forecasting
pip install -r requirements.txt
```

### 2. Train Models

```bash
python train_model.py
```

This will:
- Generate sample data (if not exists)
- Preprocess and engineer features
- Train Random Forest, XGBoost, and LSTM models
- Evaluate and select the best model
- Save models to `models/` directory

### 3. Run API Server

```bash
python run_api.py
```

The API will be available at `http://localhost:8000`

## 📊 API Endpoints

### Health Check
```bash
GET /health
```

### 24-Hour Forecast (GET - Simple)
```bash
GET /predict/24h
```
Returns 24-hour forecast using latest data from `data/aqi_data.csv`

### 24-Hour Forecast (POST - Custom Data)
```bash
POST /predict/24h
Content-Type: application/json

{
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
  ],
  "future_weather": [
    {
      "Temperature": 26.0,
      "Humidity": 45.0,
      "Wind_Speed": 6.0,
      "Wind_Direction": 190.0
    }
  ]
}
```

### 72-Hour Forecast (GET - Simple)
```bash
GET /predict/72h
```
Returns 72-hour forecast using latest data from `data/aqi_data.csv`

### 72-Hour Forecast (POST - Custom Data)
```bash
POST /predict/72h
Content-Type: application/json

{
  "historical_data": [...]
}
```

## 🔧 Model Details

### Random Forest
- **Algorithm**: Ensemble of decision trees
- **Features**: 200 trees, max depth 20
- **Best for**: Non-linear relationships, feature importance

### XGBoost
- **Algorithm**: Gradient boosting
- **Features**: 300 estimators, learning rate 0.05
- **Best for**: High accuracy, handling missing values

### LSTM
- **Algorithm**: Long Short-Term Memory neural network
- **Features**: 2-layer LSTM with 128 and 64 units
- **Best for**: Sequential patterns, long-term dependencies

## 📈 Evaluation Metrics

Models are evaluated using:
- **MAE** (Mean Absolute Error)
- **RMSE** (Root Mean Squared Error)
- **R² Score** (Coefficient of Determination)

The best model is automatically selected based on validation RMSE.

## 🎨 Feature Engineering

The system creates:
- **Lag Features**: AQI values at 1h, 3h, 6h, 12h, 24h ago
- **Rolling Features**: Mean and std over 3h, 6h, 12h, 24h windows
- **Time Features**: Hour, day, month with cyclical encoding
- **Interaction Features**: Temperature-pollutant, wind-pollutant interactions

## 📝 Usage Examples

### Generate Forecasts (Python)

```python
from scripts.forecast import AQIForecaster
import pandas as pd

# Load historical data
historical = pd.read_csv('data/aqi_data.csv')
historical['datetime'] = pd.to_datetime(historical['datetime'])

# Initialize forecaster
forecaster = AQIForecaster()

# Generate 24-hour forecast
forecast_24h = forecaster.forecast_24h(historical.tail(48))
print(forecast_24h)
```

### API Usage (cURL)

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
        "Temperature": 25.0,
        "Humidity": 50.0,
        "Wind_Speed": 5.0
      }
    ]
  }'
```

## 🔍 Model Selection

The system automatically:
1. Trains all three models
2. Evaluates on validation set
3. Selects model with lowest RMSE
4. Saves best model info to `models/best_model.json`

## 📦 Output Files

After training:
- `models/random_forest.pkl` - Random Forest model
- `models/xgboost.pkl` - XGBoost model
- `models/lstm_best.h5` - LSTM model
- `models/scaler.pkl` - Feature scaler
- `models/best_model.json` - Best model info

## 🛠️ Customization

### Use Your Own Data

Replace `data/aqi_data.csv` with your data containing:
- `datetime`: Timestamp
- `AQI`: Air Quality Index
- `PM2.5`, `PM10`, `NO2`, `SO2`, `CO`, `O3`: Pollutants
- `Temperature`, `Humidity`, `Wind Speed`, `Wind Direction`: Weather

### Adjust Model Parameters

Edit `scripts/train_models.py` to modify:
- Number of trees/estimators
- Learning rates
- Model architecture

## 📄 License

This project is provided as-is for educational and research purposes.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📧 Support

For questions or issues, please open an issue on the repository.

