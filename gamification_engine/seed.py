# gamification_engine/seed.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from .config import BADGE_SEEDS, REWARD_SEEDS, CHALLENGE_SEEDS
from .badges_service import seed_badges
from .challenges_service import seed_challenges


async def seed_all(db: AsyncIOMotorDatabase):
    """Seed badges, rewards, and challenges on startup."""
    # Seed badges
    for b in BADGE_SEEDS:
        await db.badges.update_one(
            {"badge_code": b["badge_code"]},
            {"$setOnInsert": b},
            upsert=True
        )

    # Seed rewards
    for r in REWARD_SEEDS:
        await db.rewards_catalog.update_one(
            {"reward_code": r["reward_code"]},
            {"$setOnInsert": r},
            upsert=True
        )

    # Seed challenges
    for c in CHALLENGE_SEEDS:
        await db.challenges.update_one(
            {"challenge_code": c["challenge_code"]},
            {"$setOnInsert": c},
            upsert=True
        )

