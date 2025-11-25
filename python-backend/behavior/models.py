"""
Pydantic models for behavior tracking.
"""

from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class ActivityEvent(BaseModel):
    """Represents a single activity event."""
    
    timestamp: datetime = Field(..., description="When the event occurred")
    active_window: str = Field(..., description="Name of the active window/app")
    category: str = Field(..., description="Category: focus, neutral, or distraction")
    duration_seconds: float = Field(default=0.0, description="Duration in this window (seconds)")
    streak_seconds: float = Field(default=0.0, description="Current streak duration (seconds)")
    is_app_switch: bool = Field(default=False, description="Whether this was an app switch")


class BehaviorStats(BaseModel):
    """Statistics about user behavior."""
    
    total_focus_minutes: float = Field(default=0.0, description="Total time in focus category (minutes)")
    total_distraction_minutes: float = Field(default=0.0, description="Total time in distraction category (minutes)")
    total_neutral_minutes: float = Field(default=0.0, description="Total time in neutral category (minutes)")
    total_polls: int = Field(default=0, description="Total number of context polls")
    longest_focus_streak_seconds: float = Field(default=0.0, description="Longest continuous focus streak (seconds)")
    current_streak_seconds: float = Field(default=0.0, description="Current streak duration (seconds)")
    current_category: Optional[str] = Field(default=None, description="Current category")
    app_switches: int = Field(default=0, description="Number of app switches detected")
    session_start: Optional[datetime] = Field(default=None, description="When tracking started")
    total_session_time_seconds: float = Field(default=0.0, description="Total session time since start (seconds)")
    productive_app_time_map: Dict[str, float] = Field(default_factory=dict, description="Map of app names to focus time in minutes")


class AppUsage(BaseModel):
    """Usage statistics for a specific app."""
    
    app_name: str
    total_minutes: float
    category: str
    usage_count: int


class DailySummary(BaseModel):
    """Daily summary of user behavior."""
    
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    total_focus_minutes: float = Field(default=0.0)
    total_distraction_minutes: float = Field(default=0.0)
    total_neutral_minutes: float = Field(default=0.0)
    longest_focus_streak_minutes: float = Field(default=0.0)
    top_distracting_apps: List[AppUsage] = Field(default_factory=list, description="Top 3 distracting apps")
    top_productive_apps: List[AppUsage] = Field(default_factory=list, description="Top 3 productive apps")
    total_app_switches: int = Field(default=0)
    focus_percentage: float = Field(default=0.0, description="Percentage of time in focus mode")

