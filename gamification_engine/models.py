# gamification_engine/models.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class GamificationProfile(BaseModel):
    user_key: str  # Uses same identifier from citizen login (userId, email, or phone)
    total_points: int = 0
    current_points_balance: int = 0
    level: int = 1
    badges: List[str] = Field(default_factory=list)
    rewards_unlocked: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PointsTransaction(BaseModel):
    user_key: str  # Uses same identifier from citizen login
    event_type: str
    points_delta: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    idempotency_key: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BadgeModel(BaseModel):
    badge_code: str
    name: str
    description: str
    icon_url: Optional[str]
    criteria_type: str
    criteria_config: Dict[str, Any]
    is_active: bool = True


class UserBadge(BaseModel):
    user_key: str  # Uses same identifier from citizen login
    badge_code: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)


class ChallengeModel(BaseModel):
    challenge_code: str
    name: str
    description: str
    type: str
    behaviour_type: str
    target_count: int
    reward_points: int
    reward_badge_code: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_active: bool = True


class UserChallengeProgress(BaseModel):
    user_key: str  # Uses same identifier from citizen login
    challenge_code: str
    current_count: int = 0
    is_completed: bool = False
    completed_at: Optional[datetime] = None


class StreakModel(BaseModel):
    user_key: str  # Uses same identifier from citizen login
    streak_type: str
    current_streak_days: int = 0
    longest_streak_days: int = 0
    last_action_date: Optional[datetime] = None


class RewardModel(BaseModel):
    reward_code: str
    name: str
    description: str
    points_cost: int
    category: str
    partner: Optional[str]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class RedemptionModel(BaseModel):
    user_key: str  # Uses same identifier from citizen login
    reward_code: str
    points_spent: int
    status: str = "PENDING"
    issued_token_or_code: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

