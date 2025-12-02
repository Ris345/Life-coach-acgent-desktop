"""
Smart Nudge Agent - AI-powered intervention system to keep users on track.

Provides escalating nudges when users are distracted:
- Level 1: Gentle notification
- Level 2: Firm warning
- Level 3: AI intervention (closes distractor, opens productive tab)
"""

import time
import subprocess
import threading
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from agents.base import BaseAgent
from services.database_service import get_database_service
from services.notification_service import get_notification_service

class SmartNudgeAgent(BaseAgent):
    """
    Agent that monitors user activity and provides escalating nudges
    when they're off-track from their goals.
    """
    
    def __init__(self):
        super().__init__("SmartNudgeAgent")
        self.db = get_database_service()
        self.notifier = get_notification_service()
        
        # State
        self.nudge_level = 0  # Current escalation level (0-3)
        self.last_nudge_time: Optional[datetime] = None
        self.current_user_id: Optional[str] = None
        self.active_nudge: Optional[Dict[str, Any]] = None # Store current nudge for UI overlay
        
        # Configuration (can be loaded from DB later)
        self.escalation_interval = 60  # Seconds between escalation levels (Demo: 60s)
        self.distraction_threshold = 5 # Seconds of distraction before Level 1 trigger
        
        # Dependencies
        self.data_collector = None
        self.flow_agent = None
        
        # Threading
        self._thread = None
        
        # Distractor sites
        self.distractor_sites = [
            "netflix.com", "youtube.com", "reddit.com",
            "twitter.com", "x.com", "instagram.com", 
            "facebook.com", "tiktok.com", "twitch.tv"
        ]

    def set_dependencies(self, data_collector, flow_agent):
        """Inject dependencies."""
        self.data_collector = data_collector
        self.flow_agent = flow_agent

    async def start(self):
        """Start the background nudge loop."""
        await super().start()
        self._thread = threading.Thread(target=self._nudge_loop, daemon=True)
        self._thread.start()

    def _nudge_loop(self):
        """Background loop to check for distractions."""
        print("👀 SmartNudge loop started")
        while self.is_running:
            try:
                if self.data_collector and self.flow_agent:
                    # Get current metrics
                    metrics = self.data_collector.get_usage_detailed()
                    
                    # Check Flow State (Strict Mode)
                    if self.flow_agent.is_flow_active:
                        asyncio.run(self._check_strict_mode(metrics))
                        
                time.sleep(5) # Check every 5 seconds
            except Exception as e:
                print(f"Error in SmartNudge loop: {e}")
                time.sleep(5)

    async def _check_strict_mode(self, metrics: Dict):
        """Wrapper to call process with strict mode context."""
        user_id = self.flow_agent.current_user_id
        if not user_id:
            return

        input_data = {
            "user_id": user_id,
            "goal": {"goal_text": self.flow_agent.current_goal}, 
            "metrics": metrics,
            "is_flow_active": True
        }
        await self.process(input_data)
        
    def _load_state(self, user_id: str):
        """Load last nudge state from database."""
        last_nudge = self.db.get_last_nudge_time(user_id)
        if last_nudge:
            # If last nudge was recent (within 1 hour), restore state
            if (datetime.now() - last_nudge).total_seconds() < 3600:
                self.last_nudge_time = last_nudge

    async def process(self, input_data: Any) -> Any:
        """
        Check if nudge is needed and return nudge action.
        """
        user_id = input_data.get("user_id")
        goal = input_data.get("goal")
        metrics = input_data.get("metrics", {})
        
        # Load state if user changed
        if user_id != self.current_user_id:
            self._load_state(user_id)
        
        self.current_user_id = user_id
        
        # Check if Smart Nudge is enabled
        if not self.db.get_nudge_settings(user_id):
            return {"nudge_needed": False}
        
        # STRICT MODE CHECK (If Flow is Active)
        is_flow_active = input_data.get("is_flow_active", False)
        if is_flow_active:
            return await self._handle_strict_mode(user_id, metrics)

        # NORMAL MODE CHECK
        if not self._is_off_track(goal, metrics):
            # Reset nudge level if back on track
            if self.nudge_level > 0:
                print(f"✅ User back on track, resetting nudge level")
                self.nudge_level = 0
                self.last_nudge_time = None
            return {"nudge_needed": False}
        
        # User is OFF TRACK
        print(f"⚠️ User is OFF TRACK. Nudge Level: {self.nudge_level}")
        distractor = self._get_current_distractor(metrics)
        print(f"🧐 Detected distractor: {distractor}")
        
        if distractor == "PERMISSION_ERROR":
             self.active_nudge = {
                 "nudge_needed": True,
                 "level": 1,
                 "title": "⚠️ Permission Needed",
                 "message": "I can't see your browser tabs! Please grant Automation permission to Terminal/LifeOS.",
                 "action": "notify"
             }
             return self.active_nudge
        
        # Check escalation
        if self._should_escalate():
            self.nudge_level = min(self.nudge_level + 1, 3)
            self.last_nudge_time = datetime.now()
            
            # Save event
            goal_id = goal.get("id") if goal else None
            self.db.save_nudge_event(user_id, goal_id, self.nudge_level, distractor)
            
            if self.nudge_level == 1:
                self.active_nudge = self._gentle_nudge(distractor, goal)
                return self.active_nudge
            elif self.nudge_level == 2:
                self.active_nudge = self._firm_warning(distractor, goal)
                return self.active_nudge
            elif self.nudge_level == 3:
                self.active_nudge = await self._ai_intervention(distractor, goal)
                return self.active_nudge
        
        # Clear active nudge if no nudge needed
        self.active_nudge = None
        return {"nudge_needed": False}

    async def _handle_strict_mode(self, user_id: str, metrics: Dict) -> Dict:
        """Handle strict mode interventions."""
        distractor = self._get_current_distractor(metrics)
        
        if distractor and distractor != "distractor site":
            print(f"🚨 STRICT MODE: Distraction detected: {distractor}")
            
            # Penalty
            from services.gamification_service import get_gamification_service
            gamification = get_gamification_service()
            gamification.deduct_xp(user_id, 50, f"Distraction: {self._get_site_name(distractor)}")
            
            # Close it
            if "http" in distractor:
                self._close_chrome_tab(distractor)
            
            message = f"🚫 Distraction blocked! -50 XP. Stay in Flow."
            self.notifier.send_notification("Strict Mode", message, sound="Ping")
            
            self.active_nudge = {
                "nudge_needed": True,
                "level": 3,
                "action": "strict_intervention",
                "message": message
            }
            return self.active_nudge
        return {"nudge_needed": False}
    
    def _is_off_track(self, goal: Optional[Dict], metrics: Dict) -> bool:
        """Determine if user is off-track."""
        current_status = metrics.get("current_status", {})
        active_tab = current_status.get("active_tab_url", "")
        
        if not active_tab:
            return False
            
        if active_tab == "PERMISSION_ERROR":
            return True
            
        # Check if active tab is a distractor
        for distractor in self.distractor_sites:
            if distractor in active_tab.lower():
                # We found a distractor!
                # In a real system, we'd track HOW LONG they've been here.
                # For this demo, we'll assume if they are here, they are off track.
                # But we should respect the threshold. 
                # Since we poll every 5s, we can just return True and let the escalation logic handle the "time" aspect 
                # (escalation_interval is 60s, but we need a 'trigger' threshold).
                
                # Let's assume immediate trigger for the demo, or we could track 'consecutive_distraction_checks'
                return True
                
        return False

    def _get_current_distractor(self, metrics: Dict) -> str:
        """Get the current distractor URL from metrics."""
        current_status = metrics.get("current_status", {})
        active_tab = current_status.get("active_tab_url", "")
        
        if active_tab:
            if active_tab == "PERMISSION_ERROR":
                return "PERMISSION_ERROR"
                
            for distractor in self.distractor_sites:
                if distractor in active_tab.lower():
                    return active_tab
        return "distractor site"
    
    def _should_escalate(self) -> bool:
        """Check if enough time has passed to escalate."""
        if self.last_nudge_time is None:
            return True
        elapsed = (datetime.now() - self.last_nudge_time).total_seconds()
        return elapsed >= self.escalation_interval
    
    def _gentle_nudge(self, distractor: str, goal: Optional[Dict]) -> Dict:
        """Level 1: Gentle notification."""
        goal_text = goal.get("goal_text", "your goal") if goal else "your goal"
        distractor_name = self._get_site_name(distractor)
        message = f"Hey! You're browsing {distractor_name}. Want to get back to {goal_text}?"
        
        self.notifier.send_notification("👋 Stay Focused", message)
        
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
        
        self.notifier.send_notification("⚠️ Focus Reminder", message, sound="Blow")
        
        return {
            "nudge_needed": True,
            "level": 2,
            "title": "⚠️ Focus Reminder",
            "message": message,
            "action": "notify"
        }
    
    async def _ai_intervention(self, distractor: str, goal: Optional[Dict]) -> Dict:
        """Level 3: AI takes control."""
        distractor_name = self._get_site_name(distractor)
        productive_url = self._get_productive_site(goal)
        
        success = self._close_chrome_tab(distractor)
        
        if success:
            self._open_chrome_tab(productive_url)
            message = f"I've closed {distractor_name} and opened {productive_url}. Let's get back on track! 💪"
            self.notifier.send_notification("🤖 AI Intervention", message, sound="Glass")
            
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
            message = f"Please close {distractor_name} immediately and focus on your goal!"
            self.notifier.send_notification("🤖 Focus Time", message, sound="Glass")
            return {
                "nudge_needed": True,
                "level": 3,
                "title": "🤖 Focus Time",
                "message": message,
                "action": "notify"
            }
    
    def _get_site_name(self, url: str) -> str:
        for site in self.distractor_sites:
            if site in url.lower():
                return site.replace(".com", "").title()
        return "this site"
    
    def _get_productive_site(self, goal: Optional[Dict]) -> str:
        if not goal: return "https://linkedin.com"
        goal_text = goal.get("goal_text", "").lower()
        if any(word in goal_text for word in ["learn", "code", "dev"]): return "https://leetcode.com"
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
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except Exception:
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
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except Exception:
            return False
