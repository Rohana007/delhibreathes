# gamification_engine/streaks_service.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Dict, Any, Optional


async def update_streaks_for_event(
    db: AsyncIOMotorDatabase,
    user_id: str,
    event_type: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Update streaks for events that influence streaks (e.g., RED_ZONE_AVOIDED_DAY, HEALTH_TASK_COMPLETED).
    Returns info about updated streaks.
    """
    result = {}

    # Map event types to streak types
    event_to_streak = {
        "RED_ZONE_AVOIDED_DAY": "RED_ZONE_AVOIDED_DAY",
        "HEALTH_TASK_COMPLETED": "HEALTH_STREAK",
        "CLEAN_ROUTE_COMPLETED": "CLEAN_ROUTE_STREAK"
    }

    streak_type = event_to_streak.get(event_type)
    if not streak_type:
        return result

    now = datetime.utcnow()
    doc = await db.streaks.find_one({"user_key": user_key, "streak_type": streak_type})

    if not doc:
        # create new streak
        s = {
            "user_key": user_key,
            "streak_type": streak_type,
            "current_streak_days": 1,
            "longest_streak_days": 1,
            "last_action_date": now
        }
        await db.streaks.insert_one(s)
        result[streak_type] = s
        return result

    last = doc.get("last_action_date")
    # compute if yesterday continuity
    if last:
        days_diff = (now.date() - last.date()).days
    else:
        days_diff = 999

    if days_diff == 0:
        # already counted today — no change
        return result
    elif days_diff == 1:
        # continue streak
        new_current = doc.get("current_streak_days", 0) + 1
        new_longest = max(doc.get("longest_streak_days", 0), new_current)
        await db.streaks.update_one(
            {"_id": doc["_id"]},
            {
                "$set": {
                    "current_streak_days": new_current,
                    "longest_streak_days": new_longest,
                    "last_action_date": now
                }
            }
        )
        result[streak_type] = {"current_streak_days": new_current, "longest_streak_days": new_longest}
    else:
        # reset streak
        await db.streaks.update_one(
            {"_id": doc["_id"]},
            {"$set": {"current_streak_days": 1, "last_action_date": now}}
        )
        result[streak_type] = {
            "current_streak_days": 1,
            "longest_streak_days": doc.get("longest_streak_days", 0)
        }

    return result

