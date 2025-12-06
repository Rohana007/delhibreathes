# gamification_engine/challenges_service.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, List
from datetime import datetime, timedelta
from .config import CHALLENGE_SEEDS


async def seed_challenges(db: AsyncIOMotorDatabase):
    """Seed challenges collection."""
    for c in CHALLENGE_SEEDS:
        await db.challenges.update_one(
            {"challenge_code": c["challenge_code"]},
            {"$setOnInsert": c},
            upsert=True
        )


async def update_challenges_for_event(
    db: AsyncIOMotorDatabase,
    user_key: str,
    event_type: str,
    metadata: Dict[str, Any],
    points_delta: int
) -> List[Dict[str, Any]]:
    """
    Update user challenge progress when an event is processed.
    Uses user_key from existing citizen login (no additional login required).
    Returns list of completed challenges details.
    """
    completed = []

    # Find active challenges relevant to this event_type
    cursor = db.challenges.find({
        "is_active": True,
        "behaviour_type": {"$regex": event_type, "$options": "i"}
    })

    async for ch in cursor:
        # check time window
        # For simplicity, assume challenge is active
        prog = await db.user_challenge_progress.find_one({
            "user_key": user_key,
            "challenge_code": ch["challenge_code"]
        })

        if not prog:
            prog = {
                "user_key": user_key,
                "challenge_code": ch["challenge_code"],
                "current_count": 0,
                "is_completed": False
            }
            await db.user_challenge_progress.insert_one(prog)
            prog_id = prog.get("_id")
        else:
            prog_id = prog.get("_id")

        if prog.get("is_completed"):
            continue

        # increment
        new_count = prog.get("current_count", 0) + 1
        update = {"$set": {"current_count": new_count}}

        # check completion
        if new_count >= ch.get("target_count", 999):
            update["$set"].update({
                "is_completed": True,
                "completed_at": datetime.utcnow()
            })

            # award points
            await db.user_challenge_progress.update_one({"_id": prog_id}, update)

            # award points (reuse points_service but avoid circular import; insert transaction directly or call award_points)
            # Here we add a simple points grant:
            await db.gamification_profiles.update_one(
                {"user_key": user_key},
                {
                    "$inc": {
                        "total_points": ch["reward_points"],
                        "current_points_balance": ch["reward_points"]
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )

            # Update level after points change
            profile = await db.gamification_profiles.find_one({"user_key": user_key})
            if profile:
                from .utils import compute_level
                new_level = compute_level(profile.get("total_points", 0))
                await db.gamification_profiles.update_one(
                    {"user_key": user_key},
                    {"$set": {"level": new_level}}
                )

            if ch.get("reward_badge_code"):
                await db.user_badges.insert_one({
                    "user_key": user_key,
                    "badge_code": ch["reward_badge_code"],
                    "earned_at": datetime.utcnow()
                })
                await db.gamification_profiles.update_one(
                    {"user_key": user_key},
                    {"$addToSet": {"badges": ch["reward_badge_code"]}}
                )

            completed.append({
                "challenge_code": ch["challenge_code"],
                "reward_points": ch["reward_points"],
                "badge": ch.get("reward_badge_code")
            })
        else:
            await db.user_challenge_progress.update_one({"_id": prog_id}, update)

    return completed

