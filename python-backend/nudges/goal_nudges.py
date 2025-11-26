"""
Goal-Aware Smart Nudge Engine - Generates contextual nudges based on goal alignment.
"""

from typing import Optional, Dict
from datetime import datetime


class GoalNudgeEngine:
    """
    Generates goal-aware nudges that reference the user's specific goal.
    """
    
    def __init__(self):
        self.last_nudge_time: Optional[datetime] = None
        self.nudge_cooldown_seconds = 60  # 1 minute cooldown
        self.last_nudge_type: Optional[str] = None
    
    def get_goal_nudge(
        self,
        current_category: str,
        previous_category: Optional[str],
        current_streak_seconds: float,
        goal: Optional[str],
        goal_profile: Optional[Dict],
        goal_alignment: Dict,
        active_window: Optional[str] = None
    ) -> Optional[str]:
        """
        Generate goal-aware nudge.
        
        Args:
            current_category: Current app category
            previous_category: Previous category
            current_streak_seconds: Current focus streak
            goal: User's goal text
            goal_profile: Goal profile dictionary
            goal_alignment: Goal alignment metrics
            active_window: Current active window
            
        Returns:
            Nudge message or None
        """
        now = datetime.now()
        
        # Check cooldown
        if self.last_nudge_time:
            time_since_last = (now - self.last_nudge_time).total_seconds()
            if time_since_last < self.nudge_cooldown_seconds:
                return None
        
        goal_topic = goal_profile.get("topic", "") if goal_profile else ""
        goal_minutes = goal_alignment.get("goal_minutes_today", 0)
        required_minutes = goal_alignment.get("required_minutes_today", 60)
        goal_progress = goal_alignment.get("goal_progress_percent", 0)
        
        # 1. Drift nudge (focus → distraction)
        if previous_category == "focus" and current_category == "distraction":
            if goal:
                self.last_nudge_time = now
                self.last_nudge_type = "drift"
                return f"You drifted from '{goal}'. Want to refocus?"
            else:
                self.last_nudge_time = now
                self.last_nudge_type = "drift"
                return "You switched to a distraction. Want to get back to focus?"
        
        # 2. Streak milestone nudges (goal-aware)
        if current_category == "focus" and current_streak_seconds > 0:
            streak_minutes = current_streak_seconds / 60.0
            
            # 10-minute milestone
            if streak_minutes >= 10 and streak_minutes < 11:
                if self.last_nudge_type != "streak_10":
                    self.last_nudge_time = now
                    self.last_nudge_type = "streak_10"
                    if goal_topic:
                        return f"{int(streak_minutes)}-minute {goal_topic} streak. Building momentum."
                    else:
                        return f"{int(streak_minutes)}-minute focus streak. Keep going!"
            
            # 20-minute milestone
            elif streak_minutes >= 20 and streak_minutes < 21:
                if self.last_nudge_type != "streak_20":
                    self.last_nudge_time = now
                    self.last_nudge_type = "streak_20"
                    if goal_topic:
                        return f"{int(streak_minutes)} minutes of deep focus on {goal_topic}. You're in the zone!"
                    else:
                        return f"{int(streak_minutes)} minutes of deep focus. You're in the zone!"
            
            # 30-minute milestone
            elif streak_minutes >= 30 and streak_minutes < 31:
                if self.last_nudge_type != "streak_30":
                    self.last_nudge_time = now
                    self.last_nudge_type = "streak_30"
                    if goal_topic:
                        return f"Amazing! {int(streak_minutes)} minutes of focused work on {goal_topic}. You're crushing it!"
                    else:
                        return f"Amazing! {int(streak_minutes)} minutes of focused work. You're crushing it!"
        
        # 3. Goal progress nudges
        if goal_progress >= 80 and goal_progress < 100:
            if self.last_nudge_type != "progress_80":
                self.last_nudge_time = now
                self.last_nudge_type = "progress_80"
                if goal:
                    return f"You're {int(goal_progress)}% toward today's '{goal}' goal. Almost there!"
                else:
                    return f"You're {int(goal_progress)}% toward today's goal. Almost there!"
        
        # 4. Goal achieved nudge
        if goal_progress >= 100:
            if self.last_nudge_type != "goal_achieved":
                self.last_nudge_time = now
                self.last_nudge_type = "goal_achieved"
                if goal:
                    return f"Daily '{goal}' goal achieved — excellent consistency!"
                else:
                    return f"Daily goal achieved — excellent consistency!"
        
        # 5. Return to goal nudge (if in distraction for too long)
        if current_category == "distraction" and goal:
            # This would be handled by the main nudge engine with time tracking
            pass
        
        return None
    
    def reset(self):
        """Reset nudge engine state."""
        self.last_nudge_time = None
        self.last_nudge_type = None

