import platform
import subprocess
import time
import threading
import os
from collections import defaultdict
from typing import Dict, Any, Optional, List
from agents.base import BaseAgent
from services.database_service import get_database_service

# Platform-specific imports
if platform.system() == "Darwin":
    try:
        from AppKit import NSWorkspace
        MAC_AVAILABLE = True
    except ImportError:
        MAC_AVAILABLE = False
elif platform.system() == "Windows":
    try:
        import pygetwindow as gw
        WINDOWS_AVAILABLE = True
    except ImportError:
        WINDOWS_AVAILABLE = False
else:
    MAC_AVAILABLE = False
    WINDOWS_AVAILABLE = False

class DataCollectorAgent(BaseAgent):
    """
    Agent responsible for collecting desktop telemetry.
    Tracks active applications, Chrome tabs, and calculates usage metrics.
    """
    
    def __init__(self):
        super().__init__("DataCollectorAgent")
        self.app_usage: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"visits": 0, "total_seconds": 0})
        self.chrome_tabs: List[Dict[str, Any]] = []
        self.tab_usage: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"visits": 0, "total_seconds": 0, "last_title": ""})
        self.context_switch_count = 0
        self.last_active_app: Optional[str] = None
        self.last_active_tab_url: Optional[str] = None
        self._tracking_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        
        # Database integration
        self.db = get_database_service()
        self.current_user_id: Optional[str] = None
        self.last_sync_time = time.time()
        self.sync_interval = 60  # Sync to database every 60 seconds

    async def process(self, input_data: Any) -> Any:
        """
        Process request for metrics.
        """
        if input_data == "get_metrics":
            return self.get_usage_detailed()
        elif input_data == "get_chrome_tabs":
            return self.get_chrome_tabs_data()
        elif input_data == "get_context_switches":
            return self.get_context_switch_count()
        return None

    
    def set_user(self, user_id: str):
        """
        Set the current user and load their historical data from database.
        """
        print(f"📊 Setting user: {user_id}")
        self.current_user_id = user_id
        self._load_from_database()
    
    def _load_from_database(self):
        """
        Load user's historical metrics from local SQLite database.
        """
        if not self.current_user_id:
            return
        
        print(f"📥 Loading metrics from database for user {self.current_user_id}")
        
        try:
            # Load app usage
            db_app_usage = self.db.get_app_usage(self.current_user_id, days=30)
            with self._lock:
                for app, data in db_app_usage.items():
                    if app not in self.app_usage:
                        self.app_usage[app] = {"visits": 0, "total_seconds": 0}
                    self.app_usage[app]["visits"] = data["visits"]
                    self.app_usage[app]["total_seconds"] = data["total_seconds"]
            
            # Load Chrome tabs
            db_chrome_tabs = self.db.get_chrome_tabs(self.current_user_id, days=30)
            with self._lock:
                self.chrome_tabs = db_chrome_tabs
            
            # Load context switches
            db_context_switches = self.db.get_context_switches(self.current_user_id, days=30)
            with self._lock:
                self.context_switch_count = db_context_switches
            
            print(f"✅ Loaded {len(self.app_usage)} apps, {len(self.chrome_tabs)} tabs, {self.context_switch_count} context switches")
        except Exception as e:
            print(f"❌ Error loading from database: {e}")
    
    def _sync_to_database(self):
        """
        Sync current metrics to local SQLite database.
        """
        if not self.current_user_id:
            return
        
        try:
            # Sync app usage
            with self._lock:
                for app, data in self.app_usage.items():
                    self.db.upsert_app_usage(
                        self.current_user_id,
                        app,
                        data["total_seconds"],
                        data["visits"]
                    )
            
            # Sync Chrome tabs
            with self._lock:
                for tab in self.chrome_tabs:
                    self.db.upsert_chrome_tab(
                        self.current_user_id,
                        tab.get("url", ""),
                        tab.get("title", ""),
                        tab.get("total_time", 0)
                    )
            
            # Sync context switches
            with self._lock:
                self.db.upsert_context_switches(
                    self.current_user_id,
                    self.context_switch_count
                )
            
            print(f"💾 Synced metrics to database")
        except Exception as e:
            print(f"❌ Error syncing to database: {e}")
    
    async def start(self):
        """Start the background tracking thread."""
        await super().start()
        self._tracking_thread = threading.Thread(target=self._track_loop, daemon=True)
        self._tracking_thread.start()

    def _track_loop(self):
        """Background loop that tracks active window and updates metrics."""
        while self.is_running:
            try:
                current_app = self._get_active_window()
                
                if current_app:
                    with self._lock:
                        # Track Application Usage
                        if current_app != self.last_active_app:
                            self.app_usage[current_app]["visits"] += 1
                            if self.last_active_app is not None:
                                self.context_switch_count += 1
                            self.last_active_app = current_app
                        
                        # Increment time for current app
                        self.app_usage[current_app]["total_seconds"] += 1

                        # Track Chrome Tab Usage
                        if current_app == "Google Chrome":
                            url, title = self._get_active_chrome_tab()
                            if url:
                                if url != self.last_active_tab_url:
                                    self.tab_usage[url]["visits"] += 1
                                    self.last_active_tab_url = url
                                
                                self.tab_usage[url]["total_seconds"] += 1.0
                                self.tab_usage[url]["last_title"] = title
                
                # Periodic sync to database (every 60 seconds)
                if time.time() - self.last_sync_time > self.sync_interval:
                    self._sync_to_database()
                    self.last_sync_time = time.time()
                
            except Exception as e:
                print(f"Error in tracking loop: {e}")
            
            time.sleep(1)

    def _get_active_window(self) -> str:
        """Get active window title (Platform specific)."""
        try:
            if platform.system() == "Darwin":
                script = 'tell application "System Events" to get name of first application process whose frontmost is true'
                result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
                return result.stdout.strip()
            elif platform.system() == "Windows":
                # Placeholder
                return "Unknown"
            return "Unknown"
        except Exception:
            return "Unknown"

    def _get_active_chrome_tab(self):
        """Get active Chrome tab URL and Title (macOS only)."""
        if platform.system() != "Darwin":
            return None, None

        script = """
        tell application "Google Chrome"
            if (count of windows) > 0 then
                get {URL, title} of active tab of front window
            end if
        end tell
        """
        try:
            result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                parts = result.stdout.strip().split(", ", 1)
                if len(parts) == 2:
                    return parts[0], parts[1]
        except Exception:
            pass
        return None, None

    def get_usage_detailed(self) -> Dict[str, Dict[str, float]]:
        """Return thread-safe copy of usage data."""
        with self._lock:
            return {app: data.copy() for app, data in self.app_usage.items()}

    def get_chrome_tabs_data(self) -> List[Dict[str, Any]]:
        """Return formatted Chrome tab data."""
        # This would use the JXA script logic from main.py
        # For now, returning the tracked usage
        with self._lock:
            tabs = []
            for url, data in self.tab_usage.items():
                tabs.append({
                    "url": url,
                    "title": data["last_title"],
                    "total_time": data["total_seconds"],
                    "visits": data["visits"]
                })
            return tabs

    def get_context_switch_count(self) -> int:
        """Return the total number of context switches."""
        with self._lock:
            return self.context_switch_count
