import platform
import subprocess
import time
import threading
import os
import json
from collections import defaultdict
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from agents.base import BaseAgent
from services.database_service import get_database_service

# Platform-specific imports
if platform.system() == "Darwin":
    try:
        from AppKit import NSWorkspace
        MAC_AVAILABLE = True
    except ImportError:
        MAC_AVAILABLE = False
else:
    MAC_AVAILABLE = False

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
        self._lock = threading.RLock()
        
        # Database integration
        self.db = get_database_service()
        self.current_user_id: Optional[str] = None
        self.last_sync_time = time.time()
        self.sync_interval = 60  # Sync to database every 60 seconds
        
        # Permission state
        self.has_accessibility_permission = False
        self.has_automation_permission = False
        
        # External source flag (Rust sidecar)
        self.using_external_source = True

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
        elif input_data == "check_permissions":
            return self._check_permissions()
        return None

    def update_activity(self, app_name: str, window_title: str, url: Optional[str] = None):
        """
        Update activity from external source (Rust sidecar).
        """
        self.using_external_source = True
        
        with self._lock:
            # Track Application Usage
            if app_name != self.last_active_app:
                # Initialize if new
                if app_name not in self.app_usage:
                    self.app_usage[app_name] = {"visits": 0, "total_seconds": 0}
                    
                self.app_usage[app_name]["visits"] += 1
                if self.last_active_app is not None:
                    self.context_switch_count += 1
                    # Log Context Switch
                    if self.current_user_id:
                        self.db.log_event(
                            self.current_user_id, 
                            None, 
                            "CONTEXT_SWITCH", 
                            json.dumps({"from": self.last_active_app, "to": app_name})
                        )
                self.last_active_app = app_name
            
            # Increment time for current app (assuming called every ~1s)
            if app_name in self.app_usage:
                self.app_usage[app_name]["total_seconds"] += 1

            # Track Chrome Tab Usage
            if url:
                if url != self.last_active_tab_url:
                    self.tab_usage[url]["visits"] += 1
                    # Log URL Visit
                    if self.current_user_id:
                        print(f"🔗 Logging URL Visit: {url}")
                        self.db.log_event(
                            self.current_user_id,
                            None,
                            "URL_VISIT",
                            json.dumps({"url": url, "title": window_title})
                        )
                    self.last_active_tab_url = url
                
                self.tab_usage[url]["total_seconds"] += 1.0
                self.tab_usage[url]["last_title"] = window_title

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
                for tab in db_chrome_tabs:
                    url = tab.get("url")
                    if url:
                        self.tab_usage[url] = {
                            "visits": 0,
                            "total_seconds": tab.get("total_time", 0),
                            "last_title": tab.get("title", "")
                        }
            
            # Load context switches
            db_context_switches = self.db.get_context_switches(self.current_user_id, days=30)
            with self._lock:
                self.context_switch_count = db_context_switches
            
            print(f"✅ Loaded history for user {self.current_user_id}")
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
                for url, data in self.tab_usage.items():
                    self.db.upsert_chrome_tab(
                        self.current_user_id,
                        url,
                        data["last_title"],
                        data["total_seconds"]
                    )
            
            # Sync context switches
            with self._lock:
                self.db.upsert_context_switches(
                    self.current_user_id,
                    self.context_switch_count
                )
            
            # Sync Focus/Distraction Minutes to Daily Stats
            self._sync_daily_stats()
            
            # print(f"💾 Synced metrics to database")
        except Exception as e:
            print(f"❌ Error syncing to database: {e}")

    def _sync_daily_stats(self):
        """Calculate and sync daily focus/distraction minutes."""
        if not self.current_user_id:
            return

        focus_minutes = 0
        distraction_minutes = 0
        
        productive_apps = ["Visual Studio Code", "iTerm", "Terminal", "Notion", "Obsidian", "Figma", "Xcode", "Docker", "Python", "Cursor"]
        distractor_apps = ["Messages", "Discord", "Slack", "Mail", "Spotify", "Maps", "Calendar", "Netflix", "YouTube"]
        
        with self._lock:
            # Calculate from App Usage
            for app, data in self.app_usage.items():
                minutes = data["total_seconds"] / 60
                
                if any(p.lower() in app.lower() for p in productive_apps):
                    focus_minutes += minutes
                elif any(d.lower() in app.lower() for d in distractor_apps):
                    distraction_minutes += minutes
            
            # Calculate from Chrome Tabs
            for url, data in self.tab_usage.items():
                minutes = data["total_seconds"] / 60
                if any(d in url.lower() for d in ["netflix", "youtube", "reddit", "twitter", "facebook", "instagram", "tiktok"]):
                    distraction_minutes += minutes
        
        self.db.save_daily_stats(self.current_user_id, {
            "focus_minutes": int(focus_minutes),
            "distraction_minutes": int(distraction_minutes)
        })
    
    async def start(self):
        """Start the background tracking thread."""
        await super().start()
        
        # Move permission check to the thread to avoid blocking startup
        self._tracking_thread = threading.Thread(target=self._track_loop, daemon=True)
        self._tracking_thread.start()

    def _track_loop(self):
        """Background loop that tracks active window and updates metrics."""
        print("🚀 DataCollector tracking loop started")
        
        # Initial permission check in background
        self._check_permissions()
        
        while self.is_running:
            try:
                # If receiving external updates, skip internal polling
                if self.using_external_source:
                    # Just check for DB sync
                    if time.time() - self.last_sync_time > self.sync_interval:
                        self._sync_to_database()
                        self.last_sync_time = time.time()
                    time.sleep(1)
                    continue

                current_app = self._get_active_window()
                
                # FIX: If app is Electron (Overlay), check Chrome anyway
                if current_app == "Electron" or current_app == "LifeOS":
                    # Check if Chrome has an active tab
                    c_url, c_title = self._get_active_browser_tab("Google Chrome")
                    if c_url and c_url != "NO_WINDOWS" and c_url != "PERMISSION_ERROR":
                        # Pretend we are in Chrome
                        current_app = "Google Chrome"
                
                if current_app and current_app != "Unknown":
                    # Fetch Chrome Tab Usage (OUTSIDE LOCK)
                    tab_url = None
                    tab_title = None
                    if "Chrome" in current_app or "Brave" in current_app or "Arc" in current_app:
                        tab_url, tab_title = self._get_active_browser_tab(current_app)

                    with self._lock:
                        # Track Application Usage
                        if current_app != self.last_active_app:
                            self.app_usage[current_app]["visits"] += 1
                            if self.last_active_app is not None:
                                self.context_switch_count += 1
                                # Log Context Switch
                                if self.current_user_id:
                                    self.db.log_event(
                                        self.current_user_id, 
                                        None, 
                                        "CONTEXT_SWITCH", 
                                        json.dumps({"from": self.last_active_app, "to": current_app})
                                    )
                                    
                            self.last_active_app = current_app
                        
                        # Increment time for current app
                        self.app_usage[current_app]["total_seconds"] += 1

                        # Track Chrome Tab Usage (Update with pre-fetched data)
                        if tab_url:
                            if tab_url != self.last_active_tab_url:
                                self.tab_usage[tab_url]["visits"] += 1
                                self.last_active_tab_url = tab_url
                            
                            self.tab_usage[tab_url]["total_seconds"] += 1.0
                            self.tab_usage[tab_url]["last_title"] = tab_title
                
                # Periodic sync
                if time.time() - self.last_sync_time > self.sync_interval:
                    self._sync_to_database()
                    self.last_sync_time = time.time()
                
            except Exception as e:
                print(f"Error in tracking loop: {e}")
            
            time.sleep(1)

    def _get_active_window(self) -> str:
        """Get active window title (Platform specific)."""
        if platform.system() == "Darwin":
            return self._get_active_window_mac()
        elif platform.system() == "Windows":
            return "Windows Support Pending"
        return "Unknown"

    def _get_active_window_mac(self) -> str:
        """Get active window on macOS using AppleScript."""
        script = 'tell application "System Events" to get name of first application process whose frontmost is true'
        try:
            result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=2)
            if result.returncode == 0:
                return result.stdout.strip()
            else:
                # Check for permission error
                if "not allowed" in result.stderr:
                    self.has_accessibility_permission = False
                return "Unknown"
        except Exception:
            return "Unknown"

    def _get_active_browser_tab(self, app_name: str) -> Tuple[Optional[str], Optional[str]]:
        """Get active tab URL and Title for supported browsers on macOS (Sync)."""
        if platform.system() != "Darwin":
            return None, None

        # Handle different browsers
        browser_script_name = "Google Chrome"
        if "Arc" in app_name:
            browser_script_name = "Arc"
        elif "Brave" in app_name:
            browser_script_name = "Brave Browser"
        
        script = f"""
        tell application "{browser_script_name}"
            if (count of windows) > 0 then
                get {{URL, title}} of active tab of front window
            else
                return "NO_WINDOWS"
            end if
        end tell
        """
        try:
            result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=2)
            if result.returncode == 0 and result.stdout.strip():
                output = result.stdout.strip()
                if output == "NO_WINDOWS":
                    return "PERMISSION_ERROR", "Permission Needed"
                
                parts = output.split(", ", 1)
                if len(parts) == 2:
                    return parts[0], parts[1]
                return parts[0], "Unknown Title"
        except Exception:
            pass
        return None, None

    async def _get_active_browser_tab_async(self, app_name: str) -> Tuple[Optional[str], Optional[str]]:
        """Get active tab URL and Title for supported browsers on macOS (Async)."""
        if platform.system() != "Darwin":
            return None, None

        # Handle different browsers
        browser_script_name = "Google Chrome"
        if "Arc" in app_name:
            browser_script_name = "Arc"
        elif "Brave" in app_name:
            browser_script_name = "Brave Browser"
        
        script = f"""
        tell application "{browser_script_name}"
            if (count of windows) > 0 then
                get {{URL, title}} of active tab of front window
            else
                return "NO_WINDOWS"
            end if
        end tell
        """
        try:
            proc = await asyncio.create_subprocess_exec(
                "osascript", "-e", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=2.0)
            except asyncio.TimeoutError:
                try:
                    proc.kill()
                except ProcessLookupError:
                    pass
                return None, None

            if proc.returncode == 0 and stdout.strip():
                output = stdout.decode().strip()
                if output == "NO_WINDOWS":
                    return "PERMISSION_ERROR", "Permission Needed"
                
                parts = output.split(", ", 1)
                if len(parts) == 2:
                    return parts[0], parts[1]
                return parts[0], "Unknown Title"
        except Exception:
            pass
        return None, None

    def _check_permissions(self) -> Dict[str, bool]:
        """Check if we have necessary permissions."""
        # Check Accessibility (Active Window)
        try:
            subprocess.run(["osascript", "-e", 'tell application "System Events" to get name of first application process whose frontmost is true'], 
                         capture_output=True, timeout=2, check=True)
            self.has_accessibility_permission = True
        except subprocess.CalledProcessError:
            self.has_accessibility_permission = False
        except subprocess.TimeoutExpired:
            self.has_accessibility_permission = False
            
        return {
            "accessibility": self.has_accessibility_permission,
            "automation": True # Hard to check without triggering, assume true for now or handle lazily
        }

    def get_usage_detailed(self) -> Dict[str, Any]:
        """Return thread-safe copy of usage data + current status."""
        with self._lock:
            current_app = self.last_active_app or "Unknown"
            classification = "neutral"
            
            productive_apps = ["Visual Studio Code", "iTerm", "Terminal", "Notion", "Obsidian", "Figma", "Xcode", "Docker", "Python", "Cursor"]
            distractor_apps = ["Messages", "Discord", "Slack", "Mail", "Spotify", "Maps", "Calendar", "Netflix", "YouTube"]
            
            if any(p.lower() in current_app.lower() for p in productive_apps):
                classification = "productive"
            elif any(d.lower() in current_app.lower() for d in distractor_apps):
                classification = "distracting"
                
            return {
                "usage": {app: data.copy() for app, data in self.app_usage.items()},
                "chrome_tabs": self.get_chrome_tabs_data(),
                "current_status": {
                    "app": current_app,
                    "active_tab_url": self.last_active_tab_url if ("Chrome" in current_app or "Brave" in current_app or "Arc" in current_app) else None,
                    "classification": classification,
                    "last_updated": datetime.now().isoformat(),
                    "permissions": {
                        "accessibility": self.has_accessibility_permission
                    }
                }
            }

    def get_chrome_tabs_data(self) -> List[Dict[str, Any]]:
        """Return formatted Chrome tab data."""
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
