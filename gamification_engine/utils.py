# gamification_engine/utils.py
from datetime import datetime
from math import floor
from typing import Dict
from .config import POINTS_PER_LEVEL


def now_iso():
    """Get current UTC time as ISO string."""
    return datetime.utcnow().isoformat()


def compute_level(total_points: int) -> int:
    """Calculate user level based on total points."""
    return 1 + (total_points // POINTS_PER_LEVEL)

