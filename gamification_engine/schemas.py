# gamification_engine/schemas.py
from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class EventIn(BaseModel):
    event_type: str
    metadata: Optional[Dict[str, Any]] = None
    idempotency_key: Optional[str] = None


class AwardResponse(BaseModel):
    total_points: int
    current_points_balance: int
    level: int
    badges_awarded: list
    streaks_updated: list
    challenges_updated: list


class SummaryResponse(BaseModel):
    total_points: int
    current_points_balance: int
    level: int
    badges: list
    active_streaks: list
    active_challenges: list
    completed_challenges_recent: list


class RedeemIn(BaseModel):
    reward_code: str


class RedeemResponse(BaseModel):
    status: str
    issued_token_or_code: Optional[str] = None

