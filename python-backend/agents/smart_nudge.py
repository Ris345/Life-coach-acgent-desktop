"""
Smart Nudge Agent - AI-powered intervention system.
Monitors user activity and uses MCP to intervene when off-track.
"""

import time
import threading
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime

from agents.base import BaseAgent
from services.database_service import get_database_service
from services.mcp_service import get_mcp_service
from utils.analysis import analyze_tab_usage, get_current_distractor, categorize_url

# Import Orchestrator globally to access DataCollector (circular import workaround)
# In a cleaner architecture, DataCollector would be a service, but here we access it via global
# We'll resolve it at runtime or pass it in.

class SmartNudgeAgent(BaseAgent):
    """
    Autonomous agent that monitors focus and intervenes via MCP keys.
    """
    
    def __init__(self):
        super().__init__("SmartNudgeAgent")
        self.db = get_database_service()
        self.mcp = get_mcp_service()
        
        self.nudge_level = 0
        self.last_nudge_time: Optional[datetime] = None
        self.nudge_interval = 60 # Check every minute
        
        # Dependencies
        self.data_collector = None 
        self.flow_agent = None
        
        self._monitor_thread: Optional[threading.Thread] = None
    
    def set_dependencies(self, data_collector, flow_agent=None):
        """Inject dependencies."""
        self.data_collector = data_collector
        self.flow_agent = flow_agent

    def set_data_collector(self, collector):
        """Deprecated alias for set_dependencies."""
        self.data_collector = collector

    async def start(self):
        """Start the background monitoring loop."""
        await super().start()
        
        # Start MCP Service
        self.mcp.start()
        
        # Start monitoring thread
        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()
        print("👀 Smart Nudge monitoring started")

    async def stop(self):
        await super().stop()
        self.mcp.stop()

    def _monitor_loop(self):
        """Background loop affecting checks every 60s."""
        while self.is_running:
            try:
                self._check_and_nudge()
            except Exception as e:
                print(f"❌ Error in Smart Nudge loop: {e}")
            
            time.sleep(10) # Check frequently (every 10s), but apply logic carefully

    def _check_and_nudge(self):
        """Core logic to check state and trigger nudges using OpenAI."""
        if not self.data_collector:
            return

        # Get current user
        user_id = self.data_collector.current_user_id
        if not user_id:
            return

        # Check if enabled
        if not self.db.get_nudge_settings(user_id):
            return

        # Get active goal
        goal = self.db.get_current_goal(user_id)
        if not goal:
            return

        # Prepare context for OpenAI
        # We need "current state": Active App, URL, Tabs
        chrome_tabs = self.data_collector.get_chrome_tabs_data()
        
        # Determine "current" activity based on what's active active
        current_active_app = self.data_collector.last_active_app or "Unknown"
        current_active_url = self.data_collector.last_active_tab_url or ""
        
        activity_data = {
            "active_app": current_active_app,
            "current_url": current_active_url,
            "tabs": chrome_tabs
        }
        
        # ASYNC CALL needs to be handled carefully in a sync thread loop.
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            from services.openai_service import get_openai_service
            openai_service = get_openai_service()
            
            # Analyze with OpenAI
            analysis = loop.run_until_complete(openai_service.analyze_context(goal, activity_data))
            
            if analysis.get("nudge_needed"):
                self._handle_ai_nudge(analysis, goal, user_id)
            else:
                 # Decay logic
                 pass 
                 
        except Exception as e:
            print(f"❌ Smart Nudge AI Error: {e}")
        finally:
            loop.close()

    def _handle_ai_nudge(self, analysis: Dict, goal: Dict, user_id: str):
        """Handle nudge based on AI Analysis."""
        reason = analysis.get("reason", "Distraction detected")
        level = analysis.get("level", 1)
        action = analysis.get("suggested_action", "notify")
        
        # Check cooldown
        if self.last_nudge_time:
            elapsed = (datetime.now() - self.last_nudge_time).total_seconds()
            if elapsed < 60: 
                return

        self.nudge_level = level
        self.last_nudge_time = datetime.now()
        
        print(f"🤖 AI Nudge Triggered: {reason} (Level {level})")
        
        # Log to DB
        self.db.save_nudge_event(user_id, goal.get("id"), level, reason)
        
        if level >= 3 or action == "close_tab":
             self.mcp.send_notification("🤖 AI Intervention", f"{reason}. Closing tab to help you focus.")
             # Close current tab if URL known
             current_url = self.data_collector.last_active_tab_url
             if current_url:
                 self.mcp.close_chrome_tab(current_url)
        else:
             self.mcp.send_notification("👋 Focus Check", f"{reason}")

    async def process(self, input_data: Any) -> Any:
        """
        Legacy process method compatible with Orchestrator.
        Can be used to force a check manualy.
        """
        self._check_and_nudge()
        return {"status": "checked", "level": self.nudge_level}
