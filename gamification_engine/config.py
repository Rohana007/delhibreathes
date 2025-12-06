# gamification_engine/config.py
from datetime import timedelta
from typing import Dict, Any

# Base points for events
POINTS_CONFIG: Dict[str, int] = {
    "CLEAN_ROUTE_COMPLETED": 10,
    "POLLUTION_REPORT_SUBMITTED": 15,
    "POLLUTION_REPORT_VERIFIED": 25,
    "PUBLIC_TRANSPORT_DAY": 5,
    "RED_ZONE_AVOIDED_DAY": 8,
    "HEALTH_TASK_COMPLETED": 6,
    "CAMPAIGN_PARTICIPATION": 20,
    "TREE_PLANTATION_EVENT": 50,
    "ACCOUNT_CREATED": 10
}

# Multipliers (can be applied based on context)
MULTIPLIERS: Dict[str, float] = {
    "HIGH_AQI_DAY": 1.5,
    "CAMPAIGN_BOOST": 2.0
}

# Example badge definitions (seeded)
BADGE_SEEDS = [
    {
        "badge_code": "AIR_WARRIOR",
        "name": "Air Warrior",
        "description": "Completed 10 clean routes",
        "icon_url": "/assets/badges/air_warrior.png",
        "criteria_type": "EVENT_BASED",
        "criteria_config": {"event_type": "CLEAN_ROUTE_COMPLETED", "count": 10},
        "is_active": True,
    },
    {
        "badge_code": "GREEN_GUARDIAN",
        "name": "Green Guardian",
        "description": "5 verified pollution reports",
        "icon_url": "/assets/badges/green_guardian.png",
        "criteria_type": "EVENT_BASED",
        "criteria_config": {"event_type": "POLLUTION_REPORT_VERIFIED", "count": 5},
        "is_active": True,
    },
    {
        "badge_code": "SMOKELESS_HERO",
        "name": "Smokeless Hero",
        "description": "7-day red-zone avoidance streak",
        "icon_url": "/assets/badges/smokeless_hero.png",
        "criteria_type": "STREAK_BASED",
        "criteria_config": {"streak_type": "RED_ZONE_AVOIDED_DAY", "min_days": 7},
        "is_active": True,
    },
    {
        "badge_code": "ECO_TRAVELLER",
        "name": "Eco Traveller",
        "description": "20 public transport days",
        "icon_url": "/assets/badges/eco_traveller.png",
        "criteria_type": "EVENT_BASED",
        "criteria_config": {"event_type": "PUBLIC_TRANSPORT_DAY", "count": 20},
        "is_active": True,
    },
    {
        "badge_code": "DATA_CONTRIBUTOR",
        "name": "Data Contributor",
        "description": "50 events logged",
        "icon_url": "/assets/badges/data_contributor.png",
        "criteria_type": "THRESHOLD",
        "criteria_config": {"total_events": 50},
        "is_active": True,
    }
]

# Reward catalog seeds
REWARD_SEEDS = [
    {
        "reward_code": "METRO10",
        "name": "Metro 10% Discount",
        "description": "10% discount on a single metro ride (partner DMRC)",
        "points_cost": 200,
        "category": "METRO_DISCOUNT",
        "partner": "DMRC",
        "metadata": {"coupon_type": "percent", "value": 10},
        "is_active": True,
    },
    {
        "reward_code": "BUSPASS_DAY",
        "name": "DTC Day Pass",
        "description": "1-day bus pass",
        "points_cost": 150,
        "category": "BUS_PASS",
        "partner": "DTC",
        "metadata": {"validity_days": 1},
        "is_active": True,
    },
    {
        "reward_code": "HEALTHCHK_DISCOUNT",
        "name": "Health Check Discount",
        "description": "Discount on health checkup with partner clinic",
        "points_cost": 300,
        "category": "HEALTH_CHECKUP",
        "partner": "LocalClinic",
        "metadata": {"coupon_type": "flat", "value": 100},
        "is_active": True,
    }
]

# Default challenge seeds
CHALLENGE_SEEDS = [
    {
        "challenge_code": "DAILY_CLEANROUTE_2",
        "name": "Complete 2 clean routes today",
        "description": "Choose cleaner routes twice today",
        "type": "DAILY",
        "behaviour_type": "CLEAN_ROUTE_COMPLETED",
        "target_count": 2,
        "reward_points": 20,
        "reward_badge_code": None,
        "is_active": True,
    },
    {
        "challenge_code": "WEEKLY_VERIFY_3",
        "name": "Verify 3 reports this week",
        "description": "Help verify crowd reports",
        "type": "WEEKLY",
        "behaviour_type": "POLLUTION_REPORT_VERIFIED",
        "target_count": 3,
        "reward_points": 50,
        "reward_badge_code": "DATA_CONTRIBUTOR",
        "is_active": True,
    }
]

# Leveling config
POINTS_PER_LEVEL = 100

