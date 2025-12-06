# tests/test_gamification_points.py
import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from gamification_engine.points_service import award_points
from gamification_engine.config import POINTS_CONFIG, POINTS_PER_LEVEL
from gamification_engine.utils import compute_level


@pytest.mark.asyncio
async def test_award_points_and_idempotency():
    """Test awarding points and idempotency handling."""
    # Setup a test database (replace with your test DB setup)
    # For production, use a test MongoDB instance or mongomock
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_gamification"]

    # Ensure clean state
    await db.gamification_profiles.delete_many({})
    await db.points_transactions.delete_many({})
    await db.user_badges.delete_many({})
    await db.streaks.delete_many({})
    await db.user_challenge_progress.delete_many({})

    user_id = "test_user_1"

    try:
        # Award points once
        res1 = await award_points(
            db, user_id, "ACCOUNT_CREATED", {},
            idempotency_key="k1"
        )
        assert res1["points_delta"] == POINTS_CONFIG["ACCOUNT_CREATED"]
        assert res1["status"] == "ok"

        # Repeat with same idempotency key -> skipped
        res2 = await award_points(
            db, user_id, "ACCOUNT_CREATED", {},
            idempotency_key="k1"
        )
        assert res2.get("skipped") is True

        # Verify profile was created
        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        assert profile is not None
        assert profile["total_points"] == POINTS_CONFIG["ACCOUNT_CREATED"]
        assert profile["current_points_balance"] == POINTS_CONFIG["ACCOUNT_CREATED"]

        # Verify transaction was logged
        tx_count = await db.points_transactions.count_documents({"user_id": user_id})
        assert tx_count == 1

    finally:
        # Cleanup
        await db.gamification_profiles.delete_many({})
        await db.points_transactions.delete_many({})
        await db.user_badges.delete_many({})
        await db.streaks.delete_many({})
        await db.user_challenge_progress.delete_many({})


@pytest.mark.asyncio
async def test_level_calculation():
    """Test level calculation based on points."""
    assert compute_level(0) == 1
    assert compute_level(99) == 1
    assert compute_level(100) == 2
    assert compute_level(199) == 2
    assert compute_level(200) == 3
    assert compute_level(500) == 6


@pytest.mark.asyncio
async def test_multiplier_application():
    """Test that multipliers are applied correctly."""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_gamification"]

    await db.gamification_profiles.delete_many({})
    await db.points_transactions.delete_many({})

    user_id = "test_user_2"

    try:
        # Award points with high_aqi_day multiplier
        res = await award_points(
            db, user_id, "CLEAN_ROUTE_COMPLETED",
            metadata={"high_aqi_day": True},
            idempotency_key="k2"
        )

        base_points = POINTS_CONFIG["CLEAN_ROUTE_COMPLETED"]
        expected_points = int(base_points * 1.5)  # HIGH_AQI_DAY multiplier

        assert res["points_delta"] == expected_points

        profile = await db.gamification_profiles.find_one({"user_id": user_id})
        assert profile["total_points"] == expected_points

    finally:
        await db.gamification_profiles.delete_many({})
        await db.points_transactions.delete_many({})


@pytest.mark.asyncio
async def test_streak_continuation():
    """Test streak continuation logic."""
    from gamification_engine.streaks_service import update_streaks_for_event

    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_gamification"]

    await db.streaks.delete_many({})

    user_id = "test_user_3"

    try:
        # First event - create streak
        result1 = await update_streaks_for_event(
            db, user_id, "RED_ZONE_AVOIDED_DAY", {}
        )
        assert "RED_ZONE_AVOIDED_DAY" in result1
        assert result1["RED_ZONE_AVOIDED_DAY"]["current_streak_days"] == 1

        # Second event same day - no change
        result2 = await update_streaks_for_event(
            db, user_id, "RED_ZONE_AVOIDED_DAY", {}
        )
        assert not result2  # No change

        # Verify streak exists
        streak = await db.streaks.find_one({
            "user_id": user_id,
            "streak_type": "RED_ZONE_AVOIDED_DAY"
        })
        assert streak["current_streak_days"] == 1

    finally:
        await db.streaks.delete_many({})

