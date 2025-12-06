# gamification_engine/rewards_service.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import uuid
from pymongo import ReturnDocument
from typing import List, Dict, Any


async def list_rewards(db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
    """List all active rewards."""
    cursor = db.rewards_catalog.find({"is_active": True})
    return [r async for r in cursor]


async def redeem_reward(db: AsyncIOMotorDatabase, user_key: str, reward_code: str) -> dict:
    """
    Redeem a reward for a user.
    Uses user_key from existing citizen login (no additional login required).
    Atomically checks balance, deducts points, and creates redemption record.
    """
    reward = await db.rewards_catalog.find_one({"reward_code": reward_code, "is_active": True})
    if not reward:
        raise ValueError("Invalid reward code")

    cost = int(reward["points_cost"])

    # atomic check + decrement
    profile = await db.gamification_profiles.find_one({"user_key": user_key})
    if not profile:
        raise ValueError("Profile not found")

    if profile.get("current_points_balance", 0) < cost:
        raise ValueError("Insufficient points")

    # Decrement atomically
    updated = await db.gamification_profiles.find_one_and_update(
        {"user_key": user_key, "current_points_balance": {"$gte": cost}},
        {"$inc": {"current_points_balance": -cost}, "$set": {"updated_at": datetime.utcnow()}},
        return_document=ReturnDocument.AFTER
    )

    if not updated:
        raise ValueError("Insufficient points (race condition)")

    token = str(uuid.uuid4())

    redemption = {
        "user_key": user_key,
        "reward_code": reward_code,
        "points_spent": cost,
        "status": "PENDING",
        "issued_token_or_code": token,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    await db.redemptions.insert_one(redemption)

    return {"status": "PENDING", "token": token, "reward_code": reward_code}

