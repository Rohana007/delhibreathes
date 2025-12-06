# gamification_engine/badges_service.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any
from datetime import datetime
from .config import BADGE_SEEDS


async def seed_badges(db: AsyncIOMotorDatabase):
    """Ensure badges collection is seeded."""
    for b in BADGE_SEEDS:
        await db.badges.update_one(
            {"badge_code": b["badge_code"]},
            {"$setOnInsert": b},
            upsert=True
        )


async def evaluate_badges_for_user(db: AsyncIOMotorDatabase, user_key: str) -> List[Dict[str, Any]]:
    """
    Evaluate badge criteria for the user and award any new badges.
    Uses user_key from existing citizen login (no additional login required).
    Returns list of newly awarded badge codes.
    """
    new_awarded = []

    # Load active badges
    async for badge in db.badges.find({"is_active": True}):
        badge_code = badge["badge_code"]

        # Skip if already awarded
        exists = await db.user_badges.find_one({"user_key": user_key, "badge_code": badge_code})
        if exists:
            continue

        ctype = badge.get("criteria_type")
        cfg = badge.get("criteria_config", {})

        if ctype == "EVENT_BASED":
            evt = cfg.get("event_type")
            count_needed = cfg.get("count", 1)
            cnt = await db.points_transactions.count_documents({
                "user_key": user_key,
                "event_type": evt
            })
            if cnt >= count_needed:
                await db.user_badges.insert_one({
                    "user_key": user_key,
                    "badge_code": badge_code,
                    "earned_at": datetime.utcnow()
                })
                await db.gamification_profiles.update_one(
                    {"user_key": user_key},
                    {"$addToSet": {"badges": badge_code}}
                )
                new_awarded.append(badge_code)

        elif ctype == "STREAK_BASED":
            streak_type = cfg.get("streak_type")
            min_days = cfg.get("min_days", 0)
            s = await db.streaks.find_one({"user_key": user_key, "streak_type": streak_type})
            if s and s.get("current_streak_days", 0) >= min_days:
                await db.user_badges.insert_one({
                    "user_key": user_key,
                    "badge_code": badge_code,
                    "earned_at": datetime.utcnow()
                })
                await db.gamification_profiles.update_one(
                    {"user_key": user_key},
                    {"$addToSet": {"badges": badge_code}}
                )
                new_awarded.append(badge_code)

        elif ctype == "THRESHOLD":
            total_events = cfg.get("total_events", 0)
            # use total points or events - example: use number of transactions
            cnt = await db.points_transactions.count_documents({"user_key": user_key})
            if cnt >= total_events:
                await db.user_badges.insert_one({
                    "user_key": user_key,
                    "badge_code": badge_code,
                    "earned_at": datetime.utcnow()
                })
                await db.gamification_profiles.update_one(
                    {"user_key": user_key},
                    {"$addToSet": {"badges": badge_code}}
                )
                new_awarded.append(badge_code)

        # other criteria types can be added here

    return new_awarded

