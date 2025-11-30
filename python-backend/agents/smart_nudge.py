"""
Smart Nudge Agent - AI-powered intervention system to keep users on track.

Provides escalating nudges when users are distracted:
- Level 1: Gentle notification
- Level 2: Firm warning
- Level 3: AI intervention (closes distractor, opens productive tab)
"""

import time
import subprocess
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from agents.base import BaseAgent
from services.database_service import get_database_service


class SmartNudgeAgent(BaseAgent):
    """
    Agent that monitors user activity and provides escalating nudges
    when they're off-track from their goals.
    """
    
    def __init__(self):
        super().__init__("SmartNudgeAgent")
        self.db = get_database_service()
        self.nudge_level = 0  # Current escalation level (0-3)
        self.last_nudge_time: Optional[datetime] = None
        self.nudge_interval = 900  # 15 minutes in seconds
        self.current_user_id: Optional[str] = None
        
        # Distractor sites
        self.distractor_sites = [
            "netflix.com", "youtube.com", "reddit.com",
            "twitter.com", "x.com", "instagram.com", 
            "facebook.com", "tiktok.com", "twitch.tv"
        ]
        
        # Productive sites by category
        self.productive_sites = {
            "job_search": ["linkedin.com", "indeed.com", "glassdoor.com", "monster.com"],
            "learning": ["leetcode.com", "coursera.org", "udemy.com", "hackerrank.com", 
                        "stackoverflow.com", "github.com", "freecodecamp.org"],
            "productivity": ["notion.so", "todoist.com", "trello.com"]
        }
    
    async def process(self, input_data: Any) -> Any:
        """
        Check if nudge is needed and return nudge action.
        
        Input: {
            "user_id": str,
            "goal": dict,
            "metrics": dict (tab analysis, app usage, etc.)
        }
        
        Output: {
            "nudge_needed": bool,
            "level": int,
            "message": str,
            "action": str  # "notify", "close_tab", etc.
        }
        """
        user_id = input_data.get("user_id")
        goal = input_data.get("goal")
        metrics = input_data.get("metrics", {})
        
        self.current_user_id = user_id
        
        # Check if Smart Nudge is enabled for this user
        if not self.db.get_nudge_settings(user_id):
            return {"nudge_needed": False}
        
        # Check if user is off-track
        if not self._is_off_track(goal, metrics):
            # Reset nudge level if back on track
            if self.nudge_level > 0:
                print(f"✅ User back on track, resetting nudge level")
                self.nudge_level = 0
                self.last_nudge_time = None
            return {"nudge_needed": False}
        
        # Get current distractor
        distractor = self._get_current_distractor(metrics)
        
        # Check if we should escalate
        if self._should_escalate():
            self.nudge_level = min(self.nudge_level + 1, 3)
            self.last_nudge_time = datetime.now()
            
            # Save nudge event
            goal_id = goal.get("id") if goal else None
            self.db.save_nudge_event(user_id, goal_id, self.nudge_level, distractor)
            
            if self.nudge_level == 1:
                return self._gentle_nudge(distractor, goal)
            elif self.nudge_level == 2:
                return self._firm_warning(distractor, goal)
            elif self.nudge_level == 3:
                return await self._ai_intervention(distractor, goal)
        
        return {"nudge_needed": False}
    
    def _is_off_track(self, goal: Optional[Dict], metrics: Dict) -> bool:
        """
        Determine if user is off-track based on goal timeframe and current activity.
        """
        if not goal:
            return False
        
        timeframe = goal.get("timeframe", "week")
        created_at = goal.get("created_at")
        
        # Calculate how far into the goal period we are
        if created_at:
            goal_start = datetime.fromisoformat(created_at)
            now = datetime.now()
            elapsed = now - goal_start
            
            # Check if we're in the critical period
            if timeframe == "month":
                # First 15 days
                if elapsed.days > 15:
                    return False
            elif timeframe == "week":
                # Mid-week (days 3-4)
                if elapsed.days < 3 or elapsed.days > 4:
                    return False
            elif timeframe == "day":
                # First 4 hours
                if elapsed.total_seconds() > 14400:  # 4 hours
                    return False
        
        # Check if currently distracted
        tab_analysis = metrics.get("tab_analysis", {})
        productive_time = tab_analysis.get("job_search_time", 0) + tab_analysis.get("learning_time", 0)
        distraction_time = tab_analysis.get("entertainment_time", 0)
        
        # Off-track if more distraction than productive time
        return distraction_time > productive_time and distraction_time > 300  # At least 5 minutes
    
    def _get_current_distractor(self, metrics: Dict) -> str:
        """Get the current distractor URL from metrics."""
        chrome_tabs = metrics.get("chrome_tabs", [])
        
        for tab in chrome_tabs:
            url = tab.get("url", "").lower()
            for distractor in self.distractor_sites:
                if distractor in url:
                    return url
        
        return "distractor site"
    
    def _should_escalate(self) -> bool:
        """Check if enough time has passed to escalate to next level."""
        if self.last_nudge_time is None:
            return True
        
        elapsed = (datetime.now() - self.last_nudge_time).total_seconds()
        return elapsed >= self.nudge_interval
    
    def _gentle_nudge(self, distractor: str, goal: Optional[Dict]) -> Dict:
        """Level 1: Gentle notification."""
        goal_text = goal.get("goal_text", "your goal") if goal else "your goal"
        distractor_name = self._get_site_name(distractor)
        
        message = f"Hey! You're browsing {distractor_name}. Want to get back to {goal_text}?"
        
        # Send native macOS notification
        self._send_native_notification("👋 Stay Focused", message)
        
        return {
            "nudge_needed": True,
            "level": 1,
            "title": "👋 Stay Focused",
            "message": message,
            "action": "notify"
        }
    
    def _firm_warning(self, distractor: str, goal: Optional[Dict]) -> Dict:
        """Level 2: Firm warning."""
        goal_text = goal.get("goal_text", "your goal") if goal else "your goal"
        distractor_name = self._get_site_name(distractor)
        
        message = f"Please close {distractor_name} and focus on {goal_text}"
        
        # Send native macOS notification
        self._send_native_notification("⚠️ Focus Reminder", message)
        
        return {
            "nudge_needed": True,
            "level": 2,
            "title": "⚠️ Focus Reminder",
            "message": message,
            "action": "notify"
        }
    
    async def _ai_intervention(self, distractor: str, goal: Optional[Dict]) -> Dict:
        """Level 3: AI takes control - closes distractor and opens productive tab."""
        distractor_name = self._get_site_name(distractor)
        
        # Determine productive site to open based on goal
        productive_url = self._get_productive_site(goal)
        
        # Close distractor tab
        success = self._close_chrome_tab(distractor)
        
        if success:
            # Open productive tab
            self._open_chrome_tab(productive_url)
            
            message = f"I've closed {distractor_name} and opened {productive_url}. Let's get back on track! 💪"
            
            # Send native macOS notification
            self._send_native_notification("🤖 AI Intervention", message)
            
            return {
                "nudge_needed": True,
                "level": 3,
                "title": "🤖 AI Intervention",
                "message": message,
                "action": "intervene",
                "closed": distractor,
                "opened": productive_url
            }
        else:
            # Fallback to notification if browser control fails
            message = f"Please close {distractor_name} immediately and focus on your goal!"
            
            # Send native macOS notification
            self._send_native_notification("🤖 Focus Time", message)
            
            return {
                "nudge_needed": True,
                "level": 3,
                "title": "🤖 Focus Time",
                "message": message,
                "action": "notify"
            }
    
    def _send_native_notification(self, title: str, message: str):
        """Send native macOS notification that appears system-wide."""
        try:
            # Use osascript to trigger native macOS notification
            script = f'''
            display notification "{message}" with title "{title}" sound name "default"
            '''
            
            subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True,
                timeout=5
            )
            print(f"📢 Sent notification: {title}")
        except Exception as e:
            print(f"❌ Failed to send notification: {e}")
    
    def _get_site_name(self, url: str) -> str:
        """Extract readable site name from URL."""
        for site in self.distractor_sites:
            if site in url.lower():
                return site.replace(".com", "").title()
        return "this site"
    
    def _get_productive_site(self, goal: Optional[Dict]) -> str:
        """Determine which productive site to open based on goal."""
        if not goal:
            return "https://linkedin.com"
        
        goal_text = goal.get("goal_text", "").lower()
        
        # Check for job-related keywords
        if any(word in goal_text for word in ["job", "career", "work", "position", "hire"]):
            return "https://linkedin.com"
        
        # Check for learning keywords
        if any(word in goal_text for word in ["learn", "code", "programming", "developer", "engineer"]):
            return "https://leetcode.com"
        
        # Default to LinkedIn
        return "https://linkedin.com"
    
    def _close_chrome_tab(self, url: str) -> bool:
        """Close Chrome tab containing the URL (macOS AppleScript)."""
        try:
            script = f'''
            tell application "Google Chrome"
                set windowList to every window
                repeat with w in windowList
                    set tabList to every tab of w
                    repeat with t in tabList
                        if URL of t contains "{url}" then
                            close t
                            return true
                        end if
                    end repeat
                end repeat
            end tell
            return false
            '''
            
            result = subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            return result.returncode == 0
        except Exception as e:
            print(f"❌ Failed to close tab: {e}")
            return False
    
    def _open_chrome_tab(self, url: str) -> bool:
        """Open URL in Chrome (macOS AppleScript)."""
        try:
            script = f'''
            tell application "Google Chrome"
                open location "{url}"
                activate
            end tell
            '''
            
            result = subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            return result.returncode == 0
        except Exception as e:
            print(f"❌ Failed to open tab: {e}")
            return False
