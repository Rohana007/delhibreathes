import os
import pandas as pd
from scripts.forecast import AQIForecaster


def main():
    project_root = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(project_root, "data", "aqi_data.csv")
    print("Project root:", project_root)
    print("Data path:", data_path, "exists:", os.path.exists(data_path))

    df = pd.read_csv(data_path)
    print("Loaded data shape:", df.shape)
    print(df.head())

    df["datetime"] = pd.to_datetime(df["datetime"])
    df = df.sort_values("datetime").reset_index(drop=True)

    hist = df.tail(48).copy()
    print("Hist start/end:", hist["datetime"].iloc[0], hist["datetime"].iloc[-1])

    model_path = os.path.join(project_root, "models")
    print("Model path:", model_path, "exists:", os.path.exists(model_path))

    forecaster = AQIForecaster(model_path=model_path)
    forecast = forecaster.forecast_24h(hist)
    print("Forecast shape:", forecast.shape)
    print(forecast.head())


if __name__ == "__main__":
    main()


