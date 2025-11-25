"""
Profile system for LifeOS - defines focus/distraction apps per profile type.
"""

from .profiles import get_profile, list_profiles, PROFILE_DEFINITIONS
from .goal_mapper import map_goal_to_profile, GoalMapper

__all__ = [
    "get_profile",
    "list_profiles",
    "PROFILE_DEFINITIONS",
    "map_goal_to_profile",
    "GoalMapper",
]

