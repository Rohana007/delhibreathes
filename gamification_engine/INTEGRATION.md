# Integration Guide

## Environment Variables

Add these to your `.env` file:

```ini
MONGODB_URI=mongodb://mongo:27017/delhi_breathes
REDIS_URL=redis://redis:6379/0  # optional
GP_INITIAL_BALANCE=10
POINTS_PER_LEVEL=100
```

## FastAPI Integration

Add to your `main.py` or `app.py`:

```python
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from api.gamification_routes import router as gamification_router
from gamification_engine.seed import seed_all
import os

app = FastAPI()

# Setup MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/delhi_breathes")
client = AsyncIOMotorClient(MONGODB_URI)
app.state.db = client.get_default_database()

# Mount router
app.include_router(gamification_router)

# Seed on startup
@app.on_event("startup")
async def startup_tasks():
    await seed_all(app.state.db)
    print("✅ Gamification engine seeded")

@app.on_event("shutdown")
async def shutdown_tasks():
    client.close()
```

## Authentication Integration

Update `get_user_id` in `api/gamification_routes.py` to match your auth system:

```python
async def get_user_id(request: Request) -> str:
    """Get user ID from JWT token."""
    from your_auth_module import get_current_user
    
    user = await get_current_user(request)
    return user.id
```

## Example Usage

### Award Points for Clean Route

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/gamification/event",
        json={
            "event_type": "CLEAN_ROUTE_COMPLETED",
            "metadata": {
                "route_id": "route_123",
                "clean_score": 0.8
            },
            "idempotency_key": "unique-uuid-here"
        },
        headers={"X-USER-ID": "user_123"}  # Or use JWT token
    )
    print(response.json())
```

### Get User Summary

```python
response = await client.get(
    "http://localhost:8000/gamification/summary",
    headers={"X-USER-ID": "user_123"}
)
print(response.json())
```

### Redeem Reward

```python
response = await client.post(
    "http://localhost:8000/gamification/redeem",
    json={"reward_code": "METRO10"},
    headers={"X-USER-ID": "user_123"}
)
print(response.json())
```

