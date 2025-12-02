import platform
import subprocess
import time
import threading
from typing import Dict, Any, List, Optional
from datetime import datetime
from agents.base import BaseAgent
from services.database_service import get_database_service
from services.gamification_service import get_gamification_service
from services.notification_service import get_notification_service

class FlowAgent(BaseAgent):
    """
    Agent responsible for managing Flow State.
    Actively modifies the environment (closes apps, opens tools) to induce deep work.
    """
    
    def __init__(self):
        super().__init__("FlowAgent")
        self.db = get_database_service()
        self.gamification = get_gamification_service()
        self.notifier = get_notification_service()
        
        self.is_flow_active = False
        self.flow_start_time = None
        self.current_goal = None
        self.current_user_id = None
        
        # Threading
        self._flow_thread = None
        self._stop_event = threading.Event()
        
        # System Whitelist (Apps that should NEVER be closed)
        self.system_whitelist = [
            "Finder", "System Events", "loginwindow", "Dock", "Control Center", 
            "Notification Center", "Spotlight", "UserNotificationCenter", 
            "CoreServicesUIAgent", "WindowManager", "TalentPassport", 
            "LifeOS", "lifecoachagent-desktop", "Terminal", "iTerm2", "Python"
        ]
        
        # Productive tools mapping
        self.productive_tools = {
            "coding": ["Visual Studio Code", "iTerm", "Terminal", "Docker", "Xcode"],
            "writing": ["Notion", "Obsidian", "TextEdit", "Notes"],
            "design": ["Figma", "Adobe Photoshop", "Sketch"],
            "communication": ["Slack", "Zoom"] # Only if explicitly needed
        }

    async def process(self, input_data: Any) -> Any:
        """
        Process flow state requests.
        Input: {"action": "enter" | "exit", "goal": str, "user_id": str}
        """
        action = input_data.get("action")
        
        if action == "enter":
            return await self.enter_flow(input_data.get("goal"), input_data.get("user_id"))
        elif action == "exit":
            return await self.exit_flow()
        elif action == "status":
            return {
                "is_active": self.is_flow_active,
                "duration": self._get_duration(),
                "goal": self.current_goal
            }
            
        return {"error": "Unknown action"}

    async def enter_flow(self, goal: str, user_id: str = None) -> Dict[str, Any]:
        """
        Enter Flow State:
        1. Identify allowed apps (System + Goal-specific)
        2. Close EVERYTHING else
        3. Open missing tools
        4. Start XP Loop
        """
        print(f"🌊 Entering Flow State for goal: {goal}")
        self.is_flow_active = True
        self.flow_start_time = datetime.now()
        self.current_goal = goal
        self.current_user_id = user_id
        
        actions_taken = []
        
        # 1. Determine Allowed Apps
        allowed_apps = set(self.system_whitelist)
        goal_tools = self._get_tools_for_goal(goal)
        allowed_apps.update(goal_tools)
        
        # 2. Close Non-Allowed Apps
        closed_apps = self._close_non_allowed_apps(allowed_apps)
        actions_taken.extend([f"Closed {app}" for app in closed_apps])
        
        # 3. Close Distracting Tabs (Always run this cleanup)
        closed_tabs = self._close_distractor_tabs()
        actions_taken.extend([f"Closed {tab}" for tab in closed_tabs])
        
        # 4. Open Productive Tools
        opened_tools = self._open_tools(goal_tools)
        actions_taken.extend([f"Opened {tool}" for tool in opened_tools])
        
        # 5. Start Background Loop
        self._stop_event.clear()
        self._flow_thread = threading.Thread(target=self._flow_loop, daemon=True)
        self._flow_thread.start()
        
        return {
            "status": "flow_active",
            "message": "Flow State Initiated",
            "actions": actions_taken,
            "start_time": self.flow_start_time.isoformat()
        }

    async def exit_flow(self) -> Dict[str, Any]:
        """Exit Flow State and stop the loop."""
        if not self.is_flow_active:
            return {"status": "not_active", "message": "Flow State is not active"}
            
        print("🛑 Exiting Flow State")
        self.is_flow_active = False
        self._stop_event.set()
        
        duration = self._get_duration()
        
        return {
            "status": "flow_ended",
            "message": f"Flow State ended. Duration: {duration} minutes.",
            "duration": duration
        }

    def _flow_loop(self):
        """Background loop to award XP and maintain flow."""
        print("🔄 Flow Loop Started")
        minutes_passed = 0
        
        while not self._stop_event.is_set():
            # Wait 60 seconds (or check stop event every second)
            for _ in range(60):
                if self._stop_event.is_set():
                    break
                time.sleep(1)
            
            if self._stop_event.is_set():
                break
                
            # Award XP every minute
            minutes_passed += 1
            if self.current_user_id:
                try:
                    result = self.gamification.add_xp(
                        self.current_user_id, 
                        10, 
                        f"Flow State: {minutes_passed} min"
                    )
                    
                    if result.get("leveled_up"):
                        level = result.get("new_level")
                        self.notifier.send_notification(
                            "🎉 Level Up!", 
                            f"Congratulations! You've reached Level {level}!",
                            sound="Fanfare"
                        )
                    
                    print(f"✨ Awarded 10 XP to {self.current_user_id}. Total: {result.get('new_total_xp')}")
                    
                except Exception as e:
                    print(f"Error awarding XP: {e}")

    def _get_duration(self) -> int:
        """Get duration in minutes."""
        if not self.flow_start_time:
            return 0
        delta = datetime.now() - self.flow_start_time
        return int(delta.total_seconds() / 60)

    def _close_non_allowed_apps(self, allowed_apps: set) -> List[str]:
        """Close all running apps NOT in the allowed list."""
        if platform.system() != "Darwin":
            return []
            
        closed = []
        try:
            # Get list of all visible running apps
            script = 'tell application "System Events" to get name of every process where background only is false'
            result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
            
            if result.returncode == 0:
                running_apps = [app.strip() for app in result.stdout.split(",")]
                
                for app in running_apps:
                    # Check if app is allowed (case-insensitive)
                    is_allowed = False
                    for allowed in allowed_apps:
                        if allowed.lower() in app.lower():
                            is_allowed = True
                            break
                    
                    if not is_allowed:
                        print(f"🚫 Closing non-allowed app: {app}")
                        try:
                            quit_script = f'tell application "{app}" to quit'
                            subprocess.run(["osascript", "-e", quit_script], capture_output=True, text=True)
                            closed.append(app)
                        except Exception as e:
                            print(f"Error closing {app}: {e}")
                            
        except Exception as e:
            print(f"Error getting running apps: {e}")
            
        return closed

    def _get_tools_for_goal(self, goal: str) -> List[str]:
        """Determine tools needed for the goal."""
        tools = []
        goal_lower = goal.lower()
        
        if any(w in goal_lower for w in ["code", "program", "develop", "app", "api", "backend", "frontend"]):
            tools.extend(self.productive_tools["coding"])
            
        if any(w in goal_lower for w in ["write", "blog", "post", "document"]):
            tools.extend(self.productive_tools["writing"])
            
        if any(w in goal_lower for w in ["design", "ui", "ux", "logo"]):
            tools.extend(self.productive_tools["design"])
            
        return tools
    
    def _close_distractor_tabs(self) -> List[str]:
        """Close known distractor tabs."""
        # This would ideally call SmartNudgeAgent or share logic.
        # For now, simple placeholder or duplicated logic.
        # To avoid circular deps, we'll skip complex logic here or implement basic AppleScript.
        return []

    def _open_tools(self, tools: List[str]) -> List[str]:
        """Open the specified tools."""
        if platform.system() != "Darwin":
            return []
            
        opened = []
        for tool in tools:
            try:
                # Check if already running first? 
                # 'open -a' usually brings to front if running, which is good.
                subprocess.run(["open", "-a", tool], capture_output=True)
                opened.append(tool)
            except Exception:
                pass
        return opened
