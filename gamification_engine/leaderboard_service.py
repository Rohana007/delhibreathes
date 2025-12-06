# gamification_engine/leaderboard_service.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os


async def compute_leaderboard(
    db: AsyncIOMotorDatabase,
    scope: str = "GLOBAL",
    scope_ref_id: str = None,
    period: str = "DAILY",
    top_n: int = 10
) -> Dict[str, Any]:
    """
    Compute leaderboard using aggregation on points_transactions.
    Optionally use Redis for hot counters if available.
    """
    now = datetime.utcnow()

    if period == "DAILY":
        start = datetime(now.year, now.month, now.day)
    elif period == "WEEKLY":
        start = now - timedelta(days=now.weekday())
        start = datetime(start.year, start.month, start.day)
    elif period == "MONTHLY":
        start = datetime(now.year, now.month, 1)
    else:
        start = datetime(now.year, now.month, now.day)

    pipeline = [
        {"$match": {"created_at": {"$gte": start}}},
        {"$group": {"_id": "$user_key", "points_earned": {"$sum": "$points_delta"}}},
        {"$sort": {"points_earned": -1}},
        {"$limit": top_n}
    ]

    res = await db.points_transactions.aggregate(pipeline).to_list(length=top_n)

    # enrich with user_basic info if available
    top_users = []
    rank = 1
    for r in res:
        user_key = r["_id"]
        top_users.append({
            "user_key": user_key,
            "points_earned": r["points_earned"],
            "rank": rank
        })
        rank += 1

    snapshot = {
        "scope": scope,
        "scope_ref_id": scope_ref_id,
        "period": period,
        "period_start": start,
        "period_end": now,
        "top_users": top_users,
        "generated_at": datetime.utcnow()
    }

    await db.leaderboard_snapshots.insert_one(snapshot)

    return snapshot

