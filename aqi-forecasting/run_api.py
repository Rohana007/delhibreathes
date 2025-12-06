"""
Run the AQI Forecasting API server
"""
import uvicorn

if __name__ == "__main__":
    import os
    port = int(os.getenv("ML_PORT", "8001"))  # ML server on 8001, gamification on 8000
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

