# gamification_engine/events_processor.py
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from .points_service import award_points


async def process_event(
    db: AsyncIOMotorDatabase,
    user_key: str,
    event: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Orchestrates awarding points and returns aggregated result.
    Uses user_key from existing citizen login (no additional login required).
    Event example: {"event_type": "CLEAN_ROUTE_COMPLETED", "metadata": {...}, "idempotency_key": "..."}
    """
    event_type = event.get("event_type")
    metadata = event.get("metadata", {})
    key = event.get("idempotency_key")

    return await award_points(db, user_key, event_type, metadata, key)

