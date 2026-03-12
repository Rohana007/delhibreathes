# api/gamification_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Any, Dict
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from gamification_engine.events_processor import process_event
from gamification_engine.rewards_service import list_rewards, redeem_reward
from gamification_engine.utils import compute_level
from gamification_engine.schemas import EventIn, AwardResponse, SummaryResponse, RedeemIn, RedeemResponse
from gamification_engine.leaderboard_service import compute_leaderboard

router = APIRouter(prefix="/gamification", tags=["gamification"])


def get_db(request: Request) -> AsyncIOMotorDatabase:
    """Get database from app state."""
    db = request.app.state.db
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available. Please ensure MongoDB is running and connected."
        )
    return db


async def get_user_key(request: Request) -> str:
    """
    Get user_key from existing JWT authentication.
    Uses the same identifier from citizen login (userId or email).
    NO additional login required.
    """
    try:
        import jwt
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PyJWT library not installed. Install with: pip install PyJWT"
        )
    
    # Get Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        # Use the same JWT secret as the Node.js backend
        import os
        secret = os.getenv("JWT_SECRET") or os.getenv("VERIFICATION_TOKEN_SECRET")
        if not secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT secret not configured"
            )
        
        # Decode JWT token
        decoded = jwt.decode(token, secret, algorithms=["HS256"])
        
        # Extract user_key from token (prefer userId, fallback to email)
        user_key = decoded.get("userId") or decoded.get("user_id") or decoded.get("email")
        
        if not user_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user identifier"
            )
        
        return str(user_key)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )


@router.post("/event", response_model=Dict[str, Any])
async def post_event(
    event: EventIn,
    user_key: str = Depends(get_user_key),
    request: Request = None
):
    """
    Post a gamification event (e.g., CLEAN_ROUTE_COMPLETED).
    Awards points, evaluates badges, updates streaks and challenges.
    Uses existing citizen login identity (user_key).
    """
    db = get_db(request)
    try:
        res = await process_event(db, user_key, event.dict())
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    user_key: str = Depends(get_user_key),
    request: Request = None
):
    """
    Get user's gamification summary including points, level, badges, streaks, and challenges.
    Uses existing citizen login identity (user_key).
    """
    db = get_db(request)
    profile = await db.gamification_profiles.find_one({"user_key": user_key})

    if not profile:
        # return defaults
        return {
            "total_points": 0,
            "current_points_balance": 0,
            "level": 1,
            "badges": [],
            "active_streaks": [],
            "active_challenges": [],
            "completed_challenges_recent": []
        }

    # Load badges
    badges_cursor = db.user_badges.find({"user_key": user_key})
    badges = [b async for b in badges_cursor]

    # Load active streaks
    streaks_cursor = db.streaks.find({"user_key": user_key})
    active_streaks = [s async for s in streaks_cursor]

    # Load active challenges
    acur = db.user_challenge_progress.find({"user_key": user_key, "is_completed": False})
    active_challenges = [c async for c in acur]

    # Load recent completed challenges
    recent_completed = db.user_challenge_progress.find({
        "user_key": user_key,
        "is_completed": True
    }).sort("completed_at", -1).limit(5)
    completed_challenges = [c async for c in recent_completed]

    return {
        "total_points": profile.get("total_points", 0),
        "current_points_balance": profile.get("current_points_balance", 0),
        "level": profile.get("level", compute_level(profile.get("total_points", 0))),
        "badges": [b["badge_code"] for b in badges],
        "active_streaks": active_streaks,
        "active_challenges": active_challenges,
        "completed_challenges_recent": completed_challenges
    }


@router.get("/leaderboard")
async def leaderboard(
    scope: str = "GLOBAL",
    scope_ref_id: str = None,
    period: str = "DAILY",
    top_n: int = 10,
    request: Request = None
):
    """
    Get leaderboard for specified scope, period, and top N users.
    """
    db = get_db(request)
    snap = await compute_leaderboard(db, scope, scope_ref_id, period, top_n)
    return snap


@router.get("/rewards")
async def get_rewards(request: Request):
    """
    List all active rewards available for redemption.
    """
    db = get_db(request)
    rewards = await list_rewards(db)
    return rewards


class RedeemInSchema(BaseModel):
    reward_code: str


@router.post("/redeem", response_model=Dict[str, Any])
async def redeem(
    req: RedeemInSchema,
    user_key: str = Depends(get_user_key),
    request: Request = None
):
    """
    Redeem a reward using points.
    Returns redemption token/code for partner integration.
    Uses existing citizen login identity (user_key).
    """
    db = get_db(request)
    try:
        res = await redeem_reward(db, user_key, req.reward_code)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/redemptions")
async def get_redemptions(
    user_key: str = Depends(get_user_key),
    request: Request = None
):
    """
    Get user's redemption history.
    Uses existing citizen login identity (user_key).
    """
    db = get_db(request)
    cursor = db.redemptions.find({"user_key": user_key}).sort("created_at", -1)
    return [r async for r in cursor]

