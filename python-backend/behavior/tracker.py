"""
Behavior tracking engine - tracks user activity, streaks, and statistics.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, List
from collections import defaultdict

from .models import ActivityEvent, BehaviorStats, DailySummary, AppUsage
from .categorizer import WindowCategorizer
from .persistence import DataPersistence


class BehaviorTracker:
    """
    Tracks user behavior, calculates streaks, and maintains statistics.
    """
    
    def __init__(self, enable_persistence: bool = True):
        self.categorizer = WindowCategorizer()
        self.events: List[ActivityEvent] = []
        self.session_start: Optional[datetime] = None
        
        # Persistence
        self.persistence = DataPersistence() if enable_persistence else None
        self._auto_save_enabled = enable_persistence
        self._last_save_time: Optional[datetime] = None
        self._save_interval_seconds = 30  # Auto-save every 30 seconds
        
        # Current state
        self.current_window: Optional[str] = None
        self.current_category: Optional[str] = None
        self.previous_category: Optional[str] = None  # For drift detection
        self.current_streak_start: Optional[datetime] = None
        self.current_streak_category: Optional[str] = None
        self.last_poll_time: Optional[datetime] = None
        self.current_goal: Optional[str] = None  # User's current goal
        self.current_profile: Optional[Dict] = None  # Current profile from goal mapper
        self.goal_start_time: Optional[datetime] = None  # When goal was set
        self.daily_goal_minutes: int = 60  # Default: 60 minutes per day
        
        # Statistics
        self.longest_focus_streak_seconds: float = 0.0
        self.app_usage: Dict[str, Dict[str, float]] = defaultdict(lambda: {
            "total_seconds": 0.0,
            "focus_seconds": 0.0,  # Only focus time for this app
            "category": "neutral",
            "usage_count": 0
        })
        
        # Drift detection
        self.drift_events: List[datetime] = []  # Track when drifts occur
    
    def set_goal(self, goal: str, profile: Optional[Dict] = None, daily_goal_minutes: int = 60):
        """
        Set the current user goal and profile.
        
        Args:
            goal: User's goal text
            profile: Profile dictionary from goal mapper
            daily_goal_minutes: Required focus minutes per day (default: 60)
        """
        self.current_goal = goal
        self.current_profile = profile
        self.daily_goal_minutes = daily_goal_minutes
        if not self.goal_start_time:
            self.goal_start_time = datetime.now()
    
    def record_activity(self, window_title: str, timestamp: Optional[datetime] = None, goal: Optional[str] = None) -> ActivityEvent:
        """
        Record a new activity event.
        
        Args:
            window_title: The active window/app name
            timestamp: When the activity occurred (defaults to now)
            
        Returns:
            ActivityEvent representing this activity
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        # Initialize session if this is the first call
        if self.session_start is None:
            self.session_start = timestamp
            self.last_poll_time = timestamp
        
        # Use provided goal or current goal
        goal_to_use = goal or self.current_goal
        
        # Categorize the window (profile-based)
        category = self.categorizer.categorize(window_title, self.current_profile)
        
        # Detect drift (focus → distraction or neutral)
        drift_detected = False
        if self.current_category == "focus" and category in ["distraction", "neutral"]:
            drift_detected = True
            self.drift_events.append(timestamp)
        
        # Detect app switch
        is_app_switch = (window_title != self.current_window)
        
        # Store previous category before updating
        self.previous_category = self.current_category
        
        # Calculate duration since last poll
        duration_seconds = 0.0
        if self.last_poll_time:
            duration_seconds = (timestamp - self.last_poll_time).total_seconds()
            # Cap duration at 5 minutes to handle long idle periods
            duration_seconds = min(duration_seconds, 300.0)
        
        # Update streak logic
        streak_seconds = self._update_streak(category, duration_seconds, timestamp)
        
        # Update app usage statistics
        # Track total time and focus time separately
        if window_title:
            self.app_usage[window_title]["total_seconds"] += duration_seconds
            self.app_usage[window_title]["category"] = category
            self.app_usage[window_title]["usage_count"] += 1
            # Only count focus time for focus category
            if category == "focus":
                self.app_usage[window_title]["focus_seconds"] += duration_seconds
        
        # Create event
        event = ActivityEvent(
            timestamp=timestamp,
            active_window=window_title or "Unknown",
            category=category,
            duration_seconds=duration_seconds,
            streak_seconds=streak_seconds,
            is_app_switch=is_app_switch
        )
        
        # Store event
        self.events.append(event)
        
        # Update current state
        self.current_window = window_title
        self.current_category = category
        self.last_poll_time = timestamp
        
        return event
    
    def get_previous_category(self) -> Optional[str]:
        """Get the previous category for drift detection."""
        return self.previous_category
    
    def has_drifted(self) -> bool:
        """Check if user has drifted from focus."""
        return len(self.drift_events) > 0
    
    def _update_streak(self, category: str, duration_seconds: float, timestamp: datetime) -> float:
        """
        Update streak tracking and return current streak duration.
        Streak only continues for focus category. Resets when switching to neutral or distraction.
        
        Args:
            category: Current category
            duration_seconds: Duration since last poll
            timestamp: Current timestamp
            
        Returns:
            Current streak duration in seconds (only for focus category)
        """
        # Initialize streak if needed
        if self.current_streak_start is None:
            if category == "focus":
                self.current_streak_start = timestamp
                self.current_streak_category = "focus"
            else:
                # Don't start streak for non-focus
                return 0.0
        
        # Streak only exists for focus category
        if category == "focus":
            # Check if we're continuing a focus streak
            if self.current_streak_category == "focus":
                # Streak continues
                streak_duration = (timestamp - self.current_streak_start).total_seconds()
                
                # Update longest focus streak
                if streak_duration > self.longest_focus_streak_seconds:
                    self.longest_focus_streak_seconds = streak_duration
                
                return streak_duration
            else:
                # Starting a new focus streak (was in neutral/distraction)
                self.current_streak_start = timestamp
                self.current_streak_category = "focus"
                return 0.0
        else:
            # Not in focus - reset streak
            if self.current_streak_category == "focus":
                # Streak broken - reset
                self.current_streak_start = None
                self.current_streak_category = category
            return 0.0
    
    def get_stats(self) -> BehaviorStats:
        """
        Get current behavior statistics.
        
        Returns:
            BehaviorStats with current statistics
        """
        # Calculate totals by category - ONLY count time when in that category
        focus_seconds = 0.0
        distraction_seconds = 0.0
        neutral_seconds = 0.0
        app_switches = 0
        
        for event in self.events:
            duration = event.duration_seconds
            # Only count duration for the category the event was in
            if event.category == "focus":
                focus_seconds += duration
            elif event.category == "distraction":
                distraction_seconds += duration
            elif event.category == "neutral":
                neutral_seconds += duration
            
            if event.is_app_switch:
                app_switches += 1
        
        # Calculate total session time
        total_session_time_seconds = 0.0
        if self.session_start and self.last_poll_time:
            total_session_time_seconds = (self.last_poll_time - self.session_start).total_seconds()
        
        # Get current streak (only for focus category)
        current_streak = 0.0
        if (self.current_streak_start and 
            self.last_poll_time and 
            self.current_streak_category == "focus" and
            self.current_category == "focus"):
            current_streak = (self.last_poll_time - self.current_streak_start).total_seconds()
        
        # Build productive app time map (only focus time)
        productive_app_time_map = {}
        for app_name, usage_data in self.app_usage.items():
            if usage_data["focus_seconds"] > 0:
                productive_app_time_map[app_name] = usage_data["focus_seconds"] / 60.0
        
        return BehaviorStats(
            total_focus_minutes=focus_seconds / 60.0,
            total_distraction_minutes=distraction_seconds / 60.0,
            total_neutral_minutes=neutral_seconds / 60.0,
            total_polls=len(self.events),
            longest_focus_streak_seconds=self.longest_focus_streak_seconds,
            current_streak_seconds=current_streak,
            current_category=self.current_category,
            app_switches=app_switches,
            session_start=self.session_start,
            total_session_time_seconds=total_session_time_seconds,
            productive_app_time_map=productive_app_time_map
        )
    
    def get_daily_summary(self) -> DailySummary:
        """
        Get daily summary with top apps and statistics.
        
        Returns:
            DailySummary with daily statistics
        """
        stats = self.get_stats()
        
        # Get today's date
        today = datetime.now().date()
        date_str = today.strftime("%Y-%m-%d")
        
        # Calculate focus percentage
        total_minutes = stats.total_focus_minutes + stats.total_distraction_minutes + stats.total_neutral_minutes
        focus_percentage = (stats.total_focus_minutes / total_minutes * 100.0) if total_minutes > 0 else 0.0
        
        # Get top apps by category
        # Distracting apps: sorted by total time in distraction category
        # Productive apps: sorted by FOCUS time only (not total time)
        distracting_apps = []
        productive_apps = []
        
        for app_name, usage_data in self.app_usage.items():
            if usage_data["category"] == "distraction":
                # For distracting apps, use total time
                app_usage = AppUsage(
                    app_name=app_name,
                    total_minutes=usage_data["total_seconds"] / 60.0,
                    category="distraction",
                    usage_count=usage_data["usage_count"]
                )
                distracting_apps.append(app_usage)
            elif usage_data["focus_seconds"] > 0:
                # For productive apps, use FOCUS time only
                app_usage = AppUsage(
                    app_name=app_name,
                    total_minutes=usage_data["focus_seconds"] / 60.0,  # Focus time only
                    category="focus",
                    usage_count=usage_data["usage_count"]
                )
                productive_apps.append(app_usage)
        
        # Sort and get top 3
        # Distracting apps by total time
        distracting_apps.sort(key=lambda x: x.total_minutes, reverse=True)
        # Productive apps by focus time
        productive_apps.sort(key=lambda x: x.total_minutes, reverse=True)
        
        return DailySummary(
            date=date_str,
            total_focus_minutes=stats.total_focus_minutes,
            total_distraction_minutes=stats.total_distraction_minutes,
            total_neutral_minutes=stats.total_neutral_minutes,
            longest_focus_streak_minutes=stats.longest_focus_streak_seconds / 60.0,
            top_distracting_apps=distracting_apps[:3],
            top_productive_apps=productive_apps[:3],
            total_app_switches=stats.app_switches,
            focus_percentage=round(focus_percentage, 1)
        )
    
    def get_recent_events(self, limit: int = 50) -> List[ActivityEvent]:
        """
        Get recent activity events.
        
        Args:
            limit: Maximum number of events to return
            
        Returns:
            List of recent ActivityEvent objects
        """
        return self.events[-limit:] if self.events else []
    
    def check_daily_goal_completion(self) -> bool:
        """
        Check if daily goal has been completed.
        
        Returns:
            True if focus_time_today >= daily_goal_minutes
        """
        stats = self.get_stats()
        focus_minutes = stats.total_focus_minutes
        return focus_minutes >= self.daily_goal_minutes
    
    def get_weekly_progress(self) -> int:
        """
        Get weekly progress (days completed this week).
        This is a placeholder - in production, would track across days.
        
        Returns:
            Number of days completed (0-7)
        """
        # For now, return 0. In production, would track daily completions
        # and count how many days this week have been completed
        if self.check_daily_goal_completion():
            return 1  # At least today is complete
        return 0
    
    def save_state(self) -> bool:
        """
        Save current tracking state to disk.
        
        Returns:
            True if successful, False otherwise
        """
        if not self.persistence:
            return False
        
        try:
            # Convert events to serializable format
            events_data = []
            for event in self.events:
                events_data.append({
                    "timestamp": event.timestamp.isoformat() if event.timestamp else None,
                    "active_window": event.active_window,
                    "category": event.category,
                    "duration_seconds": event.duration_seconds,
                    "streak_seconds": event.streak_seconds,
                    "is_app_switch": event.is_app_switch,
                })
            
            # Convert app_usage to serializable format
            app_usage_data = {}
            for app_name, usage in self.app_usage.items():
                app_usage_data[app_name] = {
                    "total_seconds": usage["total_seconds"],
                    "focus_seconds": usage["focus_seconds"],
                    "category": usage["category"],
                    "usage_count": usage["usage_count"],
                }
            
            # Convert drift_events to serializable format
            drift_events_data = [e.isoformat() for e in self.drift_events]
            
            data = {
                "events": events_data,
                "session_start": self.session_start.isoformat() if self.session_start else None,
                "current_window": self.current_window,
                "current_category": self.current_category,
                "previous_category": self.previous_category,
                "current_streak_start": self.current_streak_start.isoformat() if self.current_streak_start else None,
                "current_streak_category": self.current_streak_category,
                "last_poll_time": self.last_poll_time.isoformat() if self.last_poll_time else None,
                "longest_focus_streak_seconds": self.longest_focus_streak_seconds,
                "app_usage": app_usage_data,
                "drift_events": drift_events_data,
                "current_goal": self.current_goal,
                "goal_start_time": self.goal_start_time.isoformat() if self.goal_start_time else None,
                "daily_goal_minutes": self.daily_goal_minutes,
            }
            
            return self.persistence.save(data)
        except Exception as e:
            print(f"Error saving tracker state: {e}")
            return False
    
    def load_state(self) -> bool:
        """
        Load tracking state from disk.
        
        Returns:
            True if successful, False otherwise
        """
        if not self.persistence:
            return False
        
        try:
            data = self.persistence.load()
            if not data:
                return False
            
            # Restore events
            self.events.clear()
            for event_data in data.get("events", []):
                timestamp = datetime.fromisoformat(event_data["timestamp"]) if event_data.get("timestamp") else None
                event = ActivityEvent(
                    timestamp=timestamp,
                    active_window=event_data.get("active_window", "Unknown"),
                    category=event_data.get("category", "neutral"),
                    duration_seconds=event_data.get("duration_seconds", 0.0),
                    streak_seconds=event_data.get("streak_seconds", 0.0),
                    is_app_switch=event_data.get("is_app_switch", False),
                )
                self.events.append(event)
            
            # Restore session state
            if data.get("session_start"):
                self.session_start = datetime.fromisoformat(data["session_start"])
            self.current_window = data.get("current_window")
            self.current_category = data.get("current_category")
            self.previous_category = data.get("previous_category")
            
            if data.get("current_streak_start"):
                self.current_streak_start = datetime.fromisoformat(data["current_streak_start"])
            self.current_streak_category = data.get("current_streak_category")
            
            if data.get("last_poll_time"):
                self.last_poll_time = datetime.fromisoformat(data["last_poll_time"])
            
            self.longest_focus_streak_seconds = data.get("longest_focus_streak_seconds", 0.0)
            
            # Restore app usage
            self.app_usage.clear()
            for app_name, usage_data in data.get("app_usage", {}).items():
                self.app_usage[app_name] = {
                    "total_seconds": usage_data.get("total_seconds", 0.0),
                    "focus_seconds": usage_data.get("focus_seconds", 0.0),
                    "category": usage_data.get("category", "neutral"),
                    "usage_count": usage_data.get("usage_count", 0),
                }
            
            # Restore drift events
            self.drift_events.clear()
            for drift_time_str in data.get("drift_events", []):
                self.drift_events.append(datetime.fromisoformat(drift_time_str))
            
            # Restore goal state
            self.current_goal = data.get("current_goal")
            if data.get("goal_start_time"):
                self.goal_start_time = datetime.fromisoformat(data["goal_start_time"])
            self.daily_goal_minutes = data.get("daily_goal_minutes", 60)
            
            return True
        except Exception as e:
            print(f"Error loading tracker state: {e}")
            return False
    
    def _maybe_auto_save(self):
        """Auto-save if enough time has passed since last save."""
        if not self._auto_save_enabled or not self.persistence:
            return
        
        now = datetime.now()
        if (not self._last_save_time or 
            (now - self._last_save_time).total_seconds() >= self._save_interval_seconds):
            self.save_state()
            self._last_save_time = now
    
    def reset(self):
        """Reset all tracking data (useful for testing or new day)."""
        self.events.clear()
        self.session_start = None
        self.current_window = None
        self.current_category = None
        self.current_streak_start = None
        self.current_streak_category = None
        self.last_poll_time = None
        self.longest_focus_streak_seconds = 0.0
        self.app_usage.clear()
        self.drift_events.clear()
        # Don't reset goal/profile - those persist across sessions
        
        # Save after reset
        if self.persistence:
            self.save_state()

