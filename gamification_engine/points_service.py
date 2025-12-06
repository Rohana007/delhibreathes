# gamification_engine/points_service.py
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from pymongo import ReturnDocument
from .config import POINTS_CONFIG, MULTIPLIERS
from .utils import compute_level
from .badges_service import evaluate_badges_for_user
from .streaks_service import update_streaks_for_event
from .challenges_service import update_challenges_for_event


async def award_points(
    db: AsyncIOMotorDatabase,
    user_key: str,
    event_type: str,
    metadata: Optional[Dict[str, Any]] = None,
    idempotency_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Award points for an event. Ensure idempotency via idempotency_key.
    Uses user_key from existing citizen login (no additional login required).
    Returns updated profile summary and triggered updates.
    """
    metadata = metadata or {}

    # Idempotency check
    if idempotency_key:
        existing = await db.points_transactions.find_one({
            "idempotency_key": idempotency_key,
            "user_key": user_key
        })
        if existing:
            return {"status": "ok", "skipped": True}

    base = POINTS_CONFIG.get(event_type, 0)

    # Example: apply multiplier when metadata indicates high_aqi_day
    multiplier = 1.0
    if metadata.get("high_aqi_day"):
        multiplier *= MULTIPLIERS.get("HIGH_AQI_DAY", 1.0)
    if metadata.get("campaign_boost"):
        multiplier *= MULTIPLIERS.get("CAMPAIGN_BOOST", 1.0)

    points_delta = int(base * multiplier)

    if points_delta == 0:
        # still log a transaction (optional)
        await db.points_transactions.insert_one({
            "user_key": user_key,
            "event_type": event_type,
            "points_delta": 0,
            "metadata": metadata,
            "idempotency_key": idempotency_key,
            "created_at": datetime.utcnow()
        })
        return {"status": "ok", "points_delta": 0}

    # Atomic upsert on profile
    profile = await db.gamification_profiles.find_one_and_update(
        {"user_key": user_key},
        {
            "$inc": {"total_points": points_delta, "current_points_balance": points_delta},
            "$setOnInsert": {"user_key": user_key, "created_at": datetime.utcnow()},
            "$set": {"updated_at": datetime.utcnow()}
        },
        return_document=ReturnDocument.AFTER,
        upsert=True
    )

    # If profile was newly created, ensure level and initial values consistent
    total_points = profile.get("total_points", 0)
    level = compute_level(total_points)
    await db.gamification_profiles.update_one(
        {"user_key": user_key},
        {"$set": {"level": level, "updated_at": datetime.utcnow()}}
    )

    # Insert transaction
    tx = {
        "user_key": user_key,
        "event_type": event_type,
        "points_delta": points_delta,
        "metadata": metadata,
        "idempotency_key": idempotency_key,
        "created_at": datetime.utcnow()
    }
    await db.points_transactions.insert_one(tx)

    # Trigger downstream services
    newly_awarded_badges = await evaluate_badges_for_user(db, user_key)
    streak_changes = await update_streaks_for_event(db, user_key, event_type, metadata)
    challenge_updates = await update_challenges_for_event(db, user_key, event_type, metadata, points_delta)

    profile_after = await db.gamification_profiles.find_one({"user_key": user_key})
    return {
        "status": "ok",
        "points_delta": points_delta,
        "total_points": profile_after.get("total_points", 0),
        "current_points_balance": profile_after.get("current_points_balance", 0),
        "level": profile_after.get("level"),
        "badges_awarded": newly_awarded_badges,
        "streaks_updated": streak_changes,
        "challenges_updated": challenge_updates
    }

