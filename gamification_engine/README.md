# Gamification Engine - DelhiBreathes SIH

## Overview

The gamification engine converts eco-friendly actions into Green Points (GP), driving user engagement through levels, badges, streaks, challenges, and real-world rewards.

## Architecture

- **Services**: Core business logic (points, badges, streaks, challenges, rewards)
- **Routes**: FastAPI endpoints for HTTP access
- **Models**: Pydantic models for data validation
- **Config**: Configuration-driven design for points, badges, rewards, challenges

## Setup

### Environment Variables

Add to your `.env` file:

```ini
MONGODB_URI=mongodb://mongo:27017/delhi_breathes
REDIS_URL=redis://redis:6379/0  # optional
GP_INITIAL_BALANCE=10
POINTS_PER_LEVEL=100
```

### Integration

In your `main.py`:

```python
from motor.motor_asyncio import AsyncIOMotorClient
from api.gamification_routes import router as gamification_router
from gamification_engine.seed import seed_all

# Setup MongoDB
client = AsyncIOMotorClient(settings.MONGODB_URI)
app.state.db = client.get_default_database()

# Mount router
app.include_router(gamification_router)

# Seed on startup
@app.on_event("startup")
async def startup_tasks():
    await seed_all(app.state.db)
```

## API Endpoints

### POST `/gamification/event`

Post a gamification event.

**Request:**
```json
{
  "event_type": "CLEAN_ROUTE_COMPLETED",
  "metadata": {
    "route_id": "route_123",
    "clean_score": 0.8
  },
  "idempotency_key": "uuid-here"
}
```

**Response:**
```json
{
  "status": "ok",
  "points_delta": 10,
  "total_points": 120,
  "current_points_balance": 120,
  "level": 2,
  "badges_awarded": ["AIR_WARRIOR"],
  "streaks_updated": {},
  "challenges_updated": []
}
```

### GET `/gamification/summary`

Get user's gamification summary.

**Response:**
```json
{
  "total_points": 120,
  "current_points_balance": 120,
  "level": 2,
  "badges": ["AIR_WARRIOR"],
  "active_streaks": [],
  "active_challenges": [],
  "completed_challenges_recent": []
}
```

### GET `/gamification/leaderboard`

Get leaderboard.

**Query Parameters:**
- `scope`: "GLOBAL" (default)
- `scope_ref_id`: Optional scope reference
- `period`: "DAILY", "WEEKLY", "MONTHLY" (default: "DAILY")
- `top_n`: Number of top users (default: 10)

### GET `/gamification/rewards`

List all active rewards.

### POST `/gamification/redeem`

Redeem a reward.

**Request:**
```json
{
  "reward_code": "METRO10"
}
```

**Response:**
```json
{
  "status": "PENDING",
  "token": "uuid-token",
  "reward_code": "METRO10"
}
```

### GET `/gamification/redemptions`

Get user's redemption history.

## Example Usage Flows

### User Completes a Clean Route

1. Frontend POST `/gamification/event`:
```json
{
  "event_type": "CLEAN_ROUTE_COMPLETED",
  "metadata": {
    "route_id": "route_123",
    "clean_score": 0.8
  },
  "idempotency_key": "unique-uuid-here"
}
```

2. Backend:
   - Awards 10 GP
   - Updates profile (total_points, current_points_balance, level)
   - Inserts points_transaction
   - Evaluates badges (may award AIR_WARRIOR at 10 routes)
   - Updates streaks/challenges

3. Response contains updated GP, level, badges_awarded

### User Redeems Metro Discount

1. Frontend GET `/gamification/rewards` to list rewards
2. Frontend POST `/gamification/redeem`:
```json
{
  "reward_code": "METRO10"
}
```

3. Backend:
   - Checks balance (requires 200 GP)
   - Atomically deducts points
   - Creates redemption record with status=PENDING
   - Returns token for partner integration

## Event Types

- `CLEAN_ROUTE_COMPLETED`: 10 points
- `POLLUTION_REPORT_SUBMITTED`: 15 points
- `POLLUTION_REPORT_VERIFIED`: 25 points
- `PUBLIC_TRANSPORT_DAY`: 5 points
- `RED_ZONE_AVOIDED_DAY`: 8 points
- `HEALTH_TASK_COMPLETED`: 6 points
- `CAMPAIGN_PARTICIPATION`: 20 points
- `TREE_PLANTATION_EVENT`: 50 points
- `ACCOUNT_CREATED`: 10 points

## Testing

Run tests with pytest:

```bash
pytest tests/test_gamification_points.py -v
```

## Notes

- All operations are idempotent via `idempotency_key`
- Points are awarded atomically
- Level calculation: `1 + (total_points // 100)`
- Redis is optional for leaderboards (falls back to MongoDB aggregation)
- Badges, rewards, and challenges are seeded on startup

