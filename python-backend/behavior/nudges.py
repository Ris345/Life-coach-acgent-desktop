"""
Nudge engine - generates coaching interventions based on behavior patterns.
"""

from typing import Optional, Dict
from datetime import datetime


class NudgeEngine:
    """
    Generates contextual nudges based on user behavior and goals.
    """
    
    def __init__(self):
        self.last_nudge_time: Optional[datetime] = None
        self.nudge_cooldown_seconds = 60  # Don't spam nudges (1 minute cooldown)
        self.drift_detected = False
        self.last_category: Optional[str] = None
    
    def get_nudge(
        self,
        current_category: str,
        previous_category: Optional[str],
        current_streak_seconds: float,
        goal: Optional[str] = None,
        goal_profile: Optional[Dict] = None,
        focus_time_minutes: float = 0.0,
        distraction_time_minutes: float = 0.0,
        active_window: Optional[str] = None,
        daily_complete: bool = False
    ) -> Optional[str]:
        """
        Generate a nudge based on current behavior.
        
        Args:
            current_category: Current app category (focus/neutral/distraction)
            previous_category: Previous category (to detect drift)
            current_streak_seconds: Current focus streak in seconds
            goal: User's current goal (optional)
            focus_time_minutes: Total focus time today
            distraction_time_minutes: Total distraction time today
            active_window: Current active window/app name
            
        Returns:
            Nudge message string, or None if no nudge needed
        """
        now = datetime.now()
        
        # Check cooldown
        if self.last_nudge_time:
            time_since_last = (now - self.last_nudge_time).total_seconds()
            if time_since_last < self.nudge_cooldown_seconds:
                return None
        
        # Goal completion notification
        if daily_complete and not self.drift_detected:
            if not self.last_nudge_time or (now - self.last_nudge_time).total_seconds() > 300:  # 5 min cooldown
                self.last_nudge_time = now
                if goal:
                    return f"🎉 Daily goal complete! You've focused for {int(focus_time_minutes)} minutes on '{goal}'."
                else:
                    return f"🎉 Daily goal complete! You've focused for {int(focus_time_minutes)} minutes."
        
        # Detect drift (focus → distraction or neutral)
        if previous_category == "focus" and current_category in ["distraction", "neutral"]:
            # Only nudge if we haven't already nudged for this drift
            if not self.drift_detected or (self.last_nudge_time and (now - self.last_nudge_time).total_seconds() > 30):
                self.drift_detected = True
                self.last_nudge_time = now
                
                if goal:
                    return f"⚠️ You drifted from your goal: '{goal}'. Want to refocus?"
                else:
                    return "⚠️ You switched to a distraction. Want to get back to focus?"
        
        # Detect long distraction session (nudge every 5 minutes after 10 minutes)
        if current_category == "distraction" and distraction_time_minutes >= 10:
            # Check if we should nudge (every 5 minutes after 10)
            should_nudge = False
            if not self.last_nudge_time:
                should_nudge = True
            else:
                time_since_last = (now - self.last_nudge_time).total_seconds()
                # Nudge every 5 minutes (300 seconds) when in long distraction
                if time_since_last >= 300:
                    should_nudge = True
            
            if should_nudge:
                self.last_category = current_category
                self.last_nudge_time = now
                if goal:
                    return f"⏰ You've been distracted for {int(distraction_time_minutes)} minutes. Ready to work on '{goal}'?"
                else:
                    return f"⏰ You've been distracted for {int(distraction_time_minutes)} minutes. Ready to refocus?"
        
        # Positive reinforcement for good streaks (Apple-like thresholds)
        if current_category == "focus" and current_streak_seconds > 0:
            streak_minutes = current_streak_seconds / 60.0
            
            # Encourage at milestones (10m, 20m, 30m thresholds)
            if streak_minutes >= 10 and streak_minutes < 11:
                if self.last_category != "focus" or not self.last_nudge_time:
                    self.last_category = current_category
                    self.last_nudge_time = now
                    if goal:
                        return f"🔥 {int(streak_minutes)}-minute streak! You're making progress on '{goal}'."
                    else:
                        return f"🔥 {int(streak_minutes)}-minute focus streak! Keep going!"
            
            elif streak_minutes >= 20 and streak_minutes < 21:
                if self.last_category != "focus" or not self.last_nudge_time:
                    self.last_category = current_category
                    self.last_nudge_time = now
                    if goal:
                        return f"💪 {int(streak_minutes)} minutes of deep focus on '{goal}'! You're in the zone!"
                    else:
                        return f"💪 {int(streak_minutes)} minutes of deep focus! You're in the zone!"
            
            elif streak_minutes >= 30 and streak_minutes < 31:
                if self.last_category != "focus" or not self.last_nudge_time:
                    self.last_category = current_category
                    self.last_nudge_time = now
                    if goal:
                        return f"🚀 Amazing! {int(streak_minutes)} minutes of focused work on '{goal}'. You're crushing it!"
                    else:
                        return f"🚀 Amazing! {int(streak_minutes)} minutes of focused work. You're crushing it!"
        
        # Goal alignment positive feedback (using profile keywords)
        if current_category == "focus" and goal_profile and active_window:
            keywords = goal_profile.get("keywords", [])
            window_lower = active_window.lower()
            # Check if current app relates to goal keywords
            for keyword in keywords:
                if keyword.lower() in window_lower:
                    if self.last_category != "focus" or not self.last_nudge_time:
                        self.last_category = current_category
                        self.last_nudge_time = now
                        if goal:
                            return f"✅ Great! You're working on '{goal}'. This aligns with your goal!"
                        else:
                            return "✅ Great! You're working on something productive!"
        
        # Reset drift flag when returning to focus
        if current_category == "focus" and self.drift_detected:
            self.drift_detected = False
        
        self.last_category = current_category
        return None
    
    def reset(self):
        """Reset nudge engine state."""
        self.last_nudge_time = None
        self.drift_detected = False
        self.last_category = None

