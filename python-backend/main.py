"""
LifeOS - Python Sidecar Backend
FastAPI server that provides system metrics and activity monitoring.
"""

import sys
import platform
import psutil
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uvicorn
import time
import threading
from collections import defaultdict
from datetime import datetime, timedelta, date
import os
import subprocess
import json
import glob

# Import database clients and services
from db import get_supabase_client, get_sqlite_connection, close_sqlite_connection
from services.analytics_service import init_analytics_table, create_analytics_event
from services.user_service import get_user_by_email, create_user
from services.database_service import get_database_service
from services.correlation_service import CorrelationService
from models.analytics import AnalyticsEventCreate, AnalyticsEventResponse
from models.user import UserCreate
from uuid import uuid4

# Platform-specific imports for window monitoring
if platform.system() == "Darwin":  # macOS
    try:
        from AppKit import NSWorkspace
        MAC_AVAILABLE = True
    except ImportError:
        MAC_AVAILABLE = False
        print("Warning: AppKit not available. Install pyobjc: pip install pyobjc")
elif platform.system() == "Windows":
    try:
        import pygetwindow as gw
        WINDOWS_AVAILABLE = True
    except ImportError:
        WINDOWS_AVAILABLE = False
        print("Warning: pygetwindow not available. Install: pip install pygetwindow")
else:
    # Linux - using xdotool or similar would require additional setup
    MAC_AVAILABLE = False
    WINDOWS_AVAILABLE = False
    print(f"Warning: Window monitoring not fully supported on {platform.system()}")




# Import Orchestrator
from core.orchestrator import Orchestrator

# Global Orchestrator instance
orchestrator = Orchestrator()

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown."""
    # Startup
    
    # Initialize SQLite analytics table
    try:
        init_analytics_table()
        print("✅ Analytics table initialized")
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize analytics table: {e}")
    
    # Initialize Supabase client
    try:
        supabase = get_supabase_client()
        if supabase:
            print("✅ Supabase client ready for user operations")
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize Supabase: {e}")
    
    # Start Orchestrator (which starts all agents)
    await orchestrator.start()
    
    yield
    
    # Shutdown
    await orchestrator.stop()
    
    # Close SQLite connection
    try:
        close_sqlite_connection()
        print("✅ SQLite connection closed")
    except Exception as e:
        print(f"Error closing SQLite connection: {e}")


app = FastAPI(title="LifeOS Sidecar", version="2.0.0", lifespan=lifespan)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:14200",
        "http://127.0.0.1:14200",
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "tauri://localhost",
        "http://localhost:*",
        "http://127.0.0.1:*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ActivityResponse(BaseModel):
    """Response model for activity endpoint."""
    active_window: Optional[str] = None
    platform: str
    status: str


class HealthResponse(BaseModel):
    """Response model for health endpoint."""
    status: str
    platform: str
    python_version: str


class UsageResponse(BaseModel):
    """Response model for usage endpoint."""
    usage: Dict[str, Dict[str, float]]  # {app_name: {visits: count, total_seconds: time}}
    status: str



def get_active_window():
    """
    Get the name of the currently active application window.
    Platform specific implementation.
    """
    try:
        if platform.system() == "Darwin":
            script = 'tell application "System Events" to get name of first application process whose frontmost is true'
            # Add timeout to prevent hanging if AppleScript blocks
            result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=2)
            return result.stdout.strip()
        elif platform.system() == "Windows":
            # Placeholder for Windows implementation
            return "Unknown"
        else:
            return "Unknown"
    except subprocess.TimeoutExpired:
        print("⚠️ get_active_window timed out")
        return "Unknown"
    except Exception as e:
        print(f"Error getting active window: {e}")
        return "Unknown"

def get_active_chrome_tab():
    """
    Get the URL and Title of the active Chrome tab using AppleScript.
    Only works on macOS.
    """
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
        # Add timeout to prevent hanging
        result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=2)
        if result.returncode == 0 and result.stdout.strip():
            # Output format: "url, title"
            parts = result.stdout.strip().split(", ", 1)
            if len(parts) == 2:
                return parts[0], parts[1]
    except Exception:
        pass
    return None, None


def get_system_metrics() -> dict:
    """Get system metrics using psutil."""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "disk_percent": disk.percent,
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "disk_total_gb": round(disk.total / (1024**3), 2),
        }
    except Exception as e:
        print(f"Error getting system metrics: {e}")
        return {}


def get_installed_applications() -> List[Dict[str, Any]]:
    """
    Get list of installed applications on the system.
    Platform-specific implementation for macOS, Windows, and Linux.
    """
    apps = []
    system = platform.system()
    
    try:
        if system == "Darwin":  # macOS
            # Method 1: Use mdfind to find all .app bundles
            try:
                result = subprocess.run(
                    ["mdfind", "kMDItemKind == 'Application'"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode == 0:
                    app_paths = result.stdout.strip().split('\n')
                    for app_path in app_paths:
                        if app_path.endswith('.app'):
                            app_name = os.path.basename(app_path).replace('.app', '')
                            apps.append({
                                "name": app_name,
                                "path": app_path,
                                "platform": "macOS"
                            })
            except Exception as e:
                print(f"Error using mdfind: {e}")
            
            # Method 2: Check /Applications directory (fallback)
            if not apps:
                app_dirs = [
                    "/Applications",
                    os.path.expanduser("~/Applications"),
                ]
                for app_dir in app_dirs:
                    if os.path.exists(app_dir):
                        for item in os.listdir(app_dir):
                            if item.endswith('.app'):
                                app_path = os.path.join(app_dir, item)
                                apps.append({
                                    "name": item.replace('.app', ''),
                                    "path": app_path,
                                    "platform": "macOS"
                                })
        
        elif system == "Windows":
            # Windows: Check common installation directories
            try:
                import winreg
            except ImportError:
                winreg = None
            
            app_dirs = [
                os.path.join(os.environ.get("ProgramFiles", "C:\\Program Files")),
                os.path.join(os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")),
                os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs"),
            ]
            
            for app_dir in app_dirs:
                if os.path.exists(app_dir):
                    for item in os.listdir(app_dir):
                        item_path = os.path.join(app_dir, item)
                        if os.path.isdir(item_path):
                            # Look for .exe files
                            exe_files = glob.glob(os.path.join(item_path, "*.exe"))
                            if exe_files:
                                apps.append({
                                    "name": item,
                                    "path": item_path,
                                    "executable": exe_files[0] if exe_files else None,
                                    "platform": "Windows"
                                })
            
            # Also check registry for installed programs
            if winreg:
                try:
                    registry_paths = [
                        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
                        (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
                    ]
                    
                    for hkey, path in registry_paths:
                        try:
                            key = winreg.OpenKey(hkey, path)
                            for i in range(winreg.QueryInfoKey(key)[0]):
                                try:
                                    subkey_name = winreg.EnumKey(key, i)
                                    subkey = winreg.OpenKey(key, subkey_name)
                                    try:
                                        app_name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                                        try:
                                            install_location = winreg.QueryValueEx(subkey, "InstallLocation")[0]
                                        except (FileNotFoundError, OSError):
                                            install_location = None
                                        
                                        if app_name and app_name not in [a["name"] for a in apps]:
                                            apps.append({
                                                "name": app_name,
                                                "path": install_location or "",
                                                "platform": "Windows"
                                            })
                                    except (FileNotFoundError, OSError):
                                        pass
                                    finally:
                                        subkey.Close()
                                except (FileNotFoundError, OSError):
                                    continue
                            key.Close()
                        except (FileNotFoundError, OSError):
                            continue
                except Exception as e:
                    print(f"Error reading Windows registry: {e}")
        
        else:  # Linux
            # Linux: Check .desktop files in standard locations
            desktop_dirs = [
                "/usr/share/applications",
                os.path.expanduser("~/.local/share/applications"),
                "/var/lib/flatpak/exports/share/applications",
            ]
            
            for desktop_dir in desktop_dirs:
                if os.path.exists(desktop_dir):
                    for desktop_file in glob.glob(os.path.join(desktop_dir, "*.desktop")):
                        try:
                            with open(desktop_file, 'r', encoding='utf-8') as f:
                                content = f.read()
                                # Parse .desktop file
                                name = None
                                exec_path = None
                                for line in content.split('\n'):
                                    if line.startswith('Name='):
                                        name = line.split('=', 1)[1].strip()
                                    elif line.startswith('Exec='):
                                        exec_path = line.split('=', 1)[1].strip()
                                
                                if name:
                                    apps.append({
                                        "name": name,
                                        "path": exec_path or desktop_file,
                                        "platform": "Linux"
                                    })
                        except Exception as e:
                            print(f"Error reading desktop file {desktop_file}: {e}")
        
        # Remove duplicates and sort
        seen = set()
        unique_apps = []
        for app in apps:
            if app["name"] not in seen:
                seen.add(app["name"])
                unique_apps.append(app)
        
        return sorted(unique_apps, key=lambda x: x["name"].lower())
    
    except Exception as e:
        print(f"Error getting installed applications: {e}")
        return []


def track_application_usage():
    """
    Background thread function to track application usage.
    Runs every 1 second.
    """
    global last_active_app, last_active_tab_url, tracking_active, activity_logs
    
    # Set tracking_active to True when thread starts
    tracking_active = True
    
    while tracking_active:
        current_app = get_active_window()
        
        if current_app:
            # Track Application Usage
            if current_app != last_active_app:
                app_usage[current_app]["visits"] += 1
                
                # Log event
                if last_active_app:
                    msg = f"Switched from {last_active_app} to {current_app}"
                    activity_logs.append({
                        "id": str(uuid4()),
                        "type": "app",
                        "message": msg,
                        "timestamp": datetime.now().isoformat()
                    })
                    # Keep logs limited
                    if len(activity_logs) > 50:
                        activity_logs.pop(0)
                
                print(f"🔄 App changed: {last_active_app} -> {current_app}")
                if last_active_app:
                     print(f"  Recorded {app_usage[last_active_app]['total_seconds']}s for {last_active_app}")
                last_active_app = current_app
            
            app_usage[current_app]["total_seconds"] += 1.0

            # Track Chrome Tab Usage
            if current_app == "Google Chrome":
                url, title = get_active_chrome_tab()
                if url:
                    if url != last_active_tab_url:
                        tab_usage[url]["visits"] += 1
                        last_active_tab_url = url
                    
                    tab_usage[url]["total_seconds"] += 1.0
                    tab_usage[url]["last_title"] = title # Update title in case it changes
        
        time.sleep(1)


def get_usage_counts() -> Dict[str, int]:
    """
    Get visit counts per application (simplified format like {slack: 50, imessages: 56}).
    Returns counts as integers.
    """
    with tracking_lock:
        return {app: int(data["visits"]) for app, data in app_usage.items() if data["visits"] > 0}


def get_usage_detailed() -> Dict[str, Dict[str, float]]:
    """
    Get detailed usage data including visits and time spent.
    Returns {app_name: {visits: count, total_seconds: time}}.
    """
    with tracking_lock:
        # Make a copy to avoid race conditions
        # Return ALL apps, even with 0 usage, so they appear in the list
        return {app: data.copy() for app, data in app_usage.items()}


def reset_usage():
    """Reset all usage tracking data."""
    global app_usage, current_app, app_start_time
    with tracking_lock:
        app_usage.clear()
        current_app = None
        app_start_time = None


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to confirm the server is running."""
    return HealthResponse(
        status="healthy",
        platform=platform.system(),
        python_version=sys.version.split()[0]
    )


@app.get("/activity", response_model=ActivityResponse)
async def get_activity():
    """
    Get the current activity (active window/application).
    This endpoint is polled by the frontend every 1 second.
    """
    """
    Get the current activity (active window/application).
    This endpoint is polled by the frontend every 1 second.
    """
    # Use DataCollector's state which is updated by Rust
    usage_data = orchestrator.data_collector.get_usage_detailed()
    current_status = usage_data.get("current_status", {})
    active_window = current_status.get("app", "Unknown")
    
    return ActivityResponse(
        active_window=active_window,
        platform=platform.system(),
        status="ok"
    )

class ActivityUpdate(BaseModel):
    app_name: str
    window_title: str
    url: Optional[str] = None

@app.post("/api/activity/update")
def update_activity(activity: ActivityUpdate):
    """
    Receive active window update from Rust sidecar.
    """
    # Debug log
    # print(f"📥 Rust Push: {activity.app_name} - {activity.window_title}")
    
    # Pass to DataCollectorAgent
    orchestrator.data_collector.update_activity(
        app_name=activity.app_name,
        window_title=activity.window_title,
        url=activity.url
    )
    return {"status": "ok"}


@app.get("/api/activity/logs")
async def get_activity_logs():
    """
    Get recent system activity logs (app switches, etc).
    """
    from services.database_service import get_database_service
    db = get_database_service()
    
    # Get logs for current user (or all if no user context yet)
    # Ideally we should filter by user_id from auth, but for now we'll get all
    # since this is a single-user desktop app mostly.
    logs = db.get_recent_logs(limit=50)
    
    if not logs:
        return {"logs": [{
            "id": "init",
            "type": "system",
            "message": "Monitoring active...",
            "timestamp": datetime.now().isoformat()
        }]}
    
    return {"logs": logs}


@app.get("/metrics")
async def get_metrics():
    """
    Get system metrics (CPU, memory, disk).
    """
    metrics = get_system_metrics()
    return {
        "metrics": metrics,
        "platform": platform.system(),
        "status": "ok"
    }


@app.get("/api/applications")
async def get_applications():
    """
    Get list of installed applications on the system.
    Returns applications with name, path, and platform info.
    """
    try:
        apps = get_installed_applications()
        return {
            "applications": apps,
            "count": len(apps),
            "platform": platform.system(),
            "status": "ok"
        }
    except Exception as e:
        print(f"Error getting applications: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get applications: {str(e)}")


@app.get("/usage", response_model=UsageResponse)
async def get_usage():
    """
    Get application usage counts and time spent.
    Returns: {app_name: {visits: count, total_seconds: time}}
    """
    usage_data = get_usage_detailed()
    return UsageResponse(
        usage=usage_data,
        status="ok"
    )


@app.get("/usage/counts")
async def get_usage_counts_endpoint():
    """
    Get simplified usage counts (visits only).
    Returns: {app_name: visit_count}
    Example: {"slack": 50, "imessages": 56}
    """
    counts = get_usage_counts()
    return {
        "usage_counts": counts,
        "status": "ok"
    }


@app.get("/api/metrics/applications")
async def get_application_metrics():
    """
    Get comprehensive application usage metrics.
    Returns a list of applications sorted by total time spent.
    """
    detailed_usage = await orchestrator.get_metrics()
    context_switches = await orchestrator.get_context_switches()
    
    # Handle new structure from DataCollector
    current_status = None
    if "current_status" in detailed_usage:
        current_status = detailed_usage["current_status"]
        
    if "usage" in detailed_usage:
        detailed_usage = detailed_usage["usage"]
    
    metrics = []
    for app_name, data in detailed_usage.items():
        # Calculate average session duration
        visits = data["visits"]
        total_time = data["total_seconds"]
        avg_session = total_time / visits if visits > 0 else 0
        
        metrics.append({
            "name": app_name,
            "launches": visits,
            "total_time": total_time,
            "average_session": avg_session
        })
    
    # Sort by total time descending
    metrics.sort(key=lambda x: x["total_time"], reverse=True)
    
    return {
        "metrics": metrics,
        "total_applications": len(metrics),
        "context_switches": context_switches,
        "current_status": current_status,
        "status": "ok"
    }


@app.get("/api/chrome/tabs")
async def get_chrome_tabs():
    """
    Get a list of all open Google Chrome tabs using JXA (JavaScript for Automation).
    Only works on macOS.
    Includes usage stats (time and visits) for each tab.
    """
    if platform.system() != "Darwin":
        return {"tabs": [], "error": "Only supported on macOS"}
        
    tabs_data = await orchestrator.get_chrome_tabs()
    
    # Sort by total time descending
    tabs_data.sort(key=lambda x: x["total_time"], reverse=True)
        
    return {"tabs": tabs_data}


@app.post("/usage/reset")
async def reset_usage_endpoint():
    """
    Reset all usage tracking data.
    """
    reset_usage()
    return {
        "status": "ok",
        "message": "Usage data reset"
    }


@app.post("/api/morning-briefing")
async def get_morning_briefing(request: Dict[str, Any]):
    """
    Generate a morning briefing for the user.
    """
    user_id = request.get("user_id")
    goal = request.get("goal")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
        
    briefing = await orchestrator.get_morning_briefing(user_id, goal)
    return briefing


class CoachingRequest(BaseModel):
    message: str
    user_id: str
    context: Optional[Dict[str, Any]] = None

@app.post("/api/coaching/chat")
async def chat_with_coach(request: CoachingRequest):
    """
    Chat with the AI Life Coach.
    """
    from services.openai_service import get_openai_service
    service = get_openai_service()
    
    # Construct prompt with context
    context_str = ""
    if request.context:
        context_str = f"\nUser Context: {json.dumps(request.context)}"
        
    prompt = f"""
    You are a supportive and wise AI Life Coach.
    Your goal is to help the user stay focused, plan their day, and overcome distractions.
    
    User Message: {request.message}
    {context_str}
    
    Provide a helpful, encouraging, and actionable response. Keep it concise.
    """
    
    response = await service.generate_content(prompt)
    return {"response": response}




@app.get("/api/correlations")
async def get_correlations(user_id: str, days: int = 7):
    """
    Get correlation analysis between app usage and focus scores.
    """
    service = CorrelationService()
    return {"correlations": service.get_app_focus_correlations(user_id, days)}


@app.get("/api/nudge/active")
async def get_active_nudge():
    """
    Get the current active nudge for the overlay window.
    """
    nudge = orchestrator.get_active_nudge()
    return {"nudge": nudge}


@app.post("/api/flow/toggle")
async def toggle_flow_state():
    """
    Toggle Flow State (Deep Focus) on/off.
    Used by System Tray and global shortcuts.
    """
    is_active = orchestrator.flow_agent.is_flow_active
    
    if is_active:
        # Turn off
        result = await orchestrator.flow_agent.process({"action": "exit"})
        return {"status": "inactive", "message": "Flow State deactivated", "details": result}
    else:
        # Turn on
        # Use current goal from orchestrator or default
        current_goal = orchestrator.system_state.get("current_goal") or "Deep Focus Session"
        # We need a user_id, ideally from context or default. 
        # For now, we'll use a placeholder if not found, or the last active user.
        # Since this is a local desktop app, single user assumption is often okay, 
        # but let's try to get it right.
        # For now, pass None as user_id if not known, FlowAgent handles it gracefully?
        # FlowAgent needs user_id for XP.
        # Let's assume the frontend has set the user context, but the tray might not know it.
        # We can fetch the last created user from DB as a fallback?
        # Or just skip XP if no user_id.
        
        result = await orchestrator.flow_agent.process({
            "action": "enter", 
            "goal": current_goal,
            "user_id": "default_user" # Placeholder, ideally fetch real user
        })
        return {"status": "active", "message": "Flow State activated", "details": result}


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================
# All analytics operations use SQLite (local database)
# User operations use Supabase (Postgres) - see services/user_service.py

class AnalyticsEventRequest(BaseModel):
    """Request model for analytics events."""
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    event_type: str  # 'page_view', 'button_click', etc.
    route: Optional[str] = None
    element_id: Optional[str] = None  # Button ID, element ID, or event name
    metadata: Optional[Dict[str, Any]] = None


@app.post("/api/analytics/events", response_model=AnalyticsEventResponse)
async def track_analytics_event(event: AnalyticsEventRequest):
    """
    Track an analytics event.
    Writes to SQLite (local database) - NOT Supabase.
    Validates payload and inserts event into database.
    Returns 200 with minimal response.
    """
    try:
        # Validate payload
        if not event.event_type:
            raise HTTPException(status_code=400, detail="event_type is required")
        
        # Ensure at least one identifier (user_id or session_id)
        if not event.user_id and not event.session_id:
            raise HTTPException(
                status_code=400, 
                detail="Either user_id or session_id must be provided"
            )
        
        # Validate event_type (basic validation - no sensitive data)
        allowed_event_types = ['page_view', 'button_click', 'route_change', 'custom']
        if event.event_type not in allowed_event_types:
            # Allow custom event types but log them
            if not event.event_type.startswith('custom_'):
                print(f"Warning: Unknown event_type: {event.event_type}")
        
        # Sanitize metadata - remove any potentially sensitive data
        safe_metadata = {}
        if event.metadata:
            # Only allow safe keys, exclude sensitive patterns
            sensitive_keys = ['password', 'token', 'secret', 'key', 'auth', 'credit', 'ssn', 'email']
            for key, value in event.metadata.items():
                key_lower = key.lower()
                if not any(sensitive in key_lower for sensitive in sensitive_keys):
                    # Limit metadata size
                    if len(str(value)) < 1000:  # Keep payload small
                        safe_metadata[key] = value
        
        # Create analytics event model
        event_create = AnalyticsEventCreate(
            user_id=event.user_id,
            session_id=event.session_id,
            event_type=event.event_type,
            route=event.route,
            element_id=event.element_id,
            metadata=safe_metadata or {},
        )
        
        # Insert into SQLite (local database)
        try:
            success = create_analytics_event(event_create)
            if success:
                return AnalyticsEventResponse(
                    status="ok",
                    message="Event tracked"
                )
            else:
                # Log error but don't fail the request (fire-and-forget behavior)
                print(f"Error inserting analytics event to SQLite")
                return AnalyticsEventResponse(
                    status="ok",
                    message="Event queued"
                )
        except Exception as db_error:
            # Log error but don't fail the request (fire-and-forget behavior)
            print(f"Error inserting analytics event: {db_error}")
            return AnalyticsEventResponse(
                status="ok",
                message="Event queued"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        # Don't fail the request - analytics should never block the UI
        print(f"Error tracking analytics event: {e}")
        return AnalyticsEventResponse(
            status="ok",
            message="Event queued"
        )


# ============================================================================
# OAUTH CALLBACK BRIDGE
# ============================================================================
# This allows the OAuth callback (in external browser) to communicate
# with the Tauri desktop app

oauth_pending: Dict[str, Dict[str, Any]] = {}  # {state: {code, state, timestamp}}
activity_logs: List[Dict[str, Any]] = [] # Global in-memory logs


@app.post("/api/oauth/callback")
async def oauth_callback(data: Dict[str, Any]):
    """
    Receive OAuth callback data from the browser callback page.
    The desktop app will poll this endpoint to get the result.
    """
    code = data.get("code")
    state = data.get("state")
    error = data.get("error")
    
    if error:
        oauth_pending[state] = {"error": error, "timestamp": time.time()}
        return {"status": "error", "error": error}
    
    if code and state:
        oauth_pending[state] = {"code": code, "state": state, "timestamp": time.time()}
        return {"status": "ok", "message": "OAuth code received"}
    
    return {"status": "error", "error": "Missing code or state"}


@app.get("/api/oauth/callback", response_class=HTMLResponse)
async def oauth_callback_get(code: str, state: str, error: Optional[str] = None):
    """
    Handle GET request from Google OAuth redirect.
    Stores the code and returns a success page to the user.
    """
    if error:
        oauth_pending[state] = {"error": error, "timestamp": time.time()}
        return "<html><body><h1>Authentication Failed</h1><p>Error: " + error + "</p></body></html>"
    
    if code and state:
        oauth_pending[state] = {"code": code, "state": state, "timestamp": time.time()}
        return (
            "<html>"
            "<head>"
            "<title>Authentication Successful</title>"
            "<script>"
            "setTimeout(function() {"
            "window.location.href = 'lifeos://callback?code=' + new URLSearchParams(window.location.search).get('code') + '&state=' + new URLSearchParams(window.location.search).get('state');"
            "}, 1000);"
            "</script>"
            "</head>"
            "<body>"
            "<h1>Authentication Successful!</h1>"
            "<p>You have successfully signed in.</p>"
            "<p>Redirecting back to LifeOS...</p>"
            "</body>"
            "</html>"
        )
    
    return "Missing code or state"


@app.get("/api/oauth/check/{state}")
async def check_oauth_status(state: str):
    """
    Poll this endpoint to check if OAuth callback has completed.
    Returns the code if available, or error if failed, or pending if not ready yet.
    """
    if state in oauth_pending:
        result = oauth_pending[state]
        # Clean up old entries (older than 5 minutes)
        if time.time() - result.get("timestamp", 0) > 300:
            del oauth_pending[state]
            return {"status": "expired"}
        
        # Return error if present
        if "error" in result:
            return {"status": "error", "error": result["error"]}
        
        # Return success with code
        return {"status": "ready", **result}
    
    return {"status": "pending"}


@app.delete("/api/oauth/clear/{state}")
async def clear_oauth_state(state: str):
    """Clear OAuth state after successful authentication."""
    if state in oauth_pending:
        del oauth_pending[state]
    return {"status": "ok"}


# ============================================================================
# GOOGLE OAUTH USER LOGIN
# ============================================================================
class GoogleUserLogin(BaseModel):
    """Request model for Google OAuth user login."""
    id: str  # Google user ID
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None


@app.post("/api/auth/google/login")
async def google_user_login(user_data: GoogleUserLogin):
    """
    Handle Google OAuth user login for desktop app.
    Saves user credentials to Supabase, everything else stays in local DB.
    """
    try:
        # Check if user already exists in Supabase
        existing_user = get_user_by_email(user_data.email)
        
        if existing_user:
            # User exists, return their info
            print(f"✅ Existing user logged in: {existing_user.email}")
            return {
                "status": "ok",
                "user": {
                    "id": str(existing_user.id),
                    "email": existing_user.email,
                    "name": existing_user.name,
                    "picture": existing_user.picture,
                },
                "message": "User logged in successfully"
            }
        else:
            # Create new user in Supabase
            new_user = UserCreate(
                id=uuid4(),
                email=user_data.email,
                name=user_data.name,
            )
            
            created_user = create_user(new_user)
            
            if created_user:
                print(f"✅ New user created in Supabase: {created_user.email}")
                return {
                    "status": "ok",
                    "user": {
                        "id": str(created_user.id),
                        "email": created_user.email,
                        "name": created_user.name,
                        "picture": user_data.picture,  # Use picture from Google
                    },
                    "message": "User created and logged in successfully"
                }
            else:
                # If Supabase fails, still allow login but warn
                print(f"⚠️ Failed to save user to Supabase, allowing login anyway: {user_data.email}")
                return {
                    "status": "ok",
                    "user": {
                        "id": user_data.id,
                        "email": user_data.email,
                        "name": user_data.name,
                        "picture": user_data.picture,
                    },
                    "message": "User logged in successfully (local only)"
                }
    
    except Exception as e:
        print(f"Error in Google user login: {e}")
        # Don't fail the login if Supabase has issues
        print(f"⚠️ Supabase error, allowing login anyway: {user_data.email}")
        return {
            "status": "ok",
            "user": {
                "id": user_data.id,
                "email": user_data.email,
                "name": user_data.name,
                "picture": user_data.picture,
            },
            "message": "User logged in successfully (local only)"
        }


# ==================== USER AND GOAL MANAGEMENT ====================

db_service = get_database_service()

@app.post("/api/user/set")
async def set_current_user(user_data: dict):
    """
    Set current user for tracking and load their historical data.
    Creates user if not exists.
    """
    user_id = user_data.get("user_id")
    email = user_data.get("email")
    name = user_data.get("name")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    # Ensure user exists in DB
    db_service.create_user(user_id, email, name)
    
    # Set user in DataCollectorAgent
    orchestrator.data_collector.set_user(user_id)
    
    return {"status": "ok", "message": f"User {user_id} set successfully"}

@app.get("/api/user/me")
async def get_user_profile(user_id: str):
    """Get current user profile."""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    user = db_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"status": "ok", "user": dict(user)}

@app.post("/api/user/consent")
async def update_privacy_consent(data: dict):
    """Record user privacy consent."""
    user_id = data.get("user_id")
    version = data.get("version")
    consented = data.get("consented", False)
    
    if not user_id or not version:
        raise HTTPException(status_code=400, detail="user_id and version are required")
        
    db_service.update_user_privacy_consent(user_id, version, consented)
    return {"status": "ok", "message": "Consent updated"}

@app.post("/api/goals/set")
async def set_user_goal(goal_data: dict):
    """
    Save user goal to local database and send to orchestrator for LLM analysis.
    Waits for analysis to complete and saves the generated strategy.
    """
    user_id = goal_data.get("user_id")
    goal_text = goal_data.get("goal")
    timeframe = goal_data.get("timeframe", "week")
    
    if not user_id or not goal_text:
        raise HTTPException(status_code=400, detail="user_id and goal are required")
    
    # Send to orchestrator for LLM analysis first
    print(f"🤖 Analyzing goal for user {user_id}: {goal_text}")
    analysis = await orchestrator.set_goal(goal_text)
    
    # Extract strategy from analysis
    strategy_json = None
    if analysis and "strategy" in analysis:
        try:
            strategy_json = json.dumps(analysis["strategy"])
        except Exception as e:
            print(f"Error serializing strategy: {e}")
    
    # Save to local database with strategy
    goal = db_service.save_goal(user_id, goal_text, timeframe, strategy_json)
    
    return {
        "status": "ok",
        "goal": goal,
        "message": "Goal saved successfully"
    }

@app.get("/api/goals/current")
async def get_current_goal(user_id: str):
    """
    Get user's current active goal from local database.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    goal = db_service.get_current_goal(user_id)
    
    return {
        "status": "ok",
        "goal": goal
    }

@app.get("/api/goals/history")
async def get_goal_history(user_id: str):
    """
    Get all goals for a user.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    goals = db_service.get_user_goals(user_id)
    
    return {
        "status": "ok",
        "goals": goals
    }

@app.post("/api/goals/switch")
async def switch_goal(request: Dict[str, Any]):
    """
    Switch active goal.
    """
    user_id = request.get("user_id")
    goal_id = request.get("goal_id")
    
    if not user_id or not goal_id:
        raise HTTPException(status_code=400, detail="user_id and goal_id are required")
    
    success = db_service.set_active_goal(user_id, goal_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    return {
        "status": "ok",
        "message": "Goal switched successfully"
    }


# ==================== SMART NUDGE ENDPOINTS ====================

@app.get("/api/nudge/settings")
async def get_nudge_settings(user_id: str):
    """
    Get user's Smart Nudge enabled status.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    enabled = db_service.get_nudge_settings(user_id)
    
    return {
        "status": "ok",
        "enabled": enabled
    }

@app.post("/api/nudge/settings")
async def update_nudge_settings(settings_data: dict):
    """
    Update user's Smart Nudge enabled status.
    """
    user_id = settings_data.get("user_id")
    enabled = settings_data.get("enabled", False)
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    db_service.set_nudge_settings(user_id, enabled)
    
    return {
        "status": "ok",
        "message": f"Smart Nudge {'enabled' if enabled else 'disabled'}"
    }

@app.get("/api/nudge/check")
async def check_nudge_status(user_id: str):
    """
    Check if a nudge is needed for the user.
    Called periodically by frontend when Smart Nudge is enabled.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    try:
        # Get user's goal
        goal = db_service.get_current_goal(user_id)
        
        # Get current metrics
        chrome_tabs = await orchestrator.get_chrome_tabs()
        print(f"🔍 Raw Chrome Tabs: {len(chrome_tabs)} tabs found")
        for tab in chrome_tabs:
            print(f"  - {tab.get('url')} ({tab.get('total_time')}s)")
            
        app_metrics = await orchestrator.get_metrics()
        context_switches = await orchestrator.get_context_switches()
        
        # Categorize tabs for analysis
        job_sites = ["linkedin.com", "indeed.com", "glassdoor.com"]
        learning_sites = ["leetcode.com", "coursera.org", "udemy.com"]
        entertainment_sites = ["youtube.com", "netflix.com", "reddit.com"]
        
        job_time = sum(tab.get("total_time", 0) for tab in chrome_tabs if any(site in tab.get("url", "").lower() for site in job_sites))
        learning_time = sum(tab.get("total_time", 0) for tab in chrome_tabs if any(site in tab.get("url", "").lower() for site in learning_sites))
        entertainment_time = sum(tab.get("total_time", 0) for tab in chrome_tabs if any(site in tab.get("url", "").lower() for site in entertainment_sites))
        
        # Prepare metrics for nudge agent
        metrics = {
            "chrome_tabs": chrome_tabs,
            "app_metrics": app_metrics,
            "context_switches": context_switches,
            "tab_analysis": {
                "job_search_time": job_time,
                "learning_time": learning_time,
                "entertainment_time": entertainment_time
            }
        }
        
        # Check with Smart Nudge Agent
        nudge_result = await orchestrator.smart_nudge_agent.process({
            "user_id": user_id,
            "goal": goal,
            "metrics": metrics
        })
        
        return {
            "status": "ok",
            "nudge": nudge_result
        }
    except Exception as e:
        print(f"Error checking nudge status: {e}")
        return {
            "status": "ok",
            "nudge": {"nudge_needed": False}
        }

@app.post("/api/nudge/test")
async def test_nudge(request: Dict[str, Any]):
    """
    Trigger a test notification.
    """
    user_id = request.get("user_id")
    level = request.get("level", 1)
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    try:
        # Trigger a test notification via SmartNudgeAgent
        # We'll access the method directly for testing
        agent = orchestrator.smart_nudge_agent
        
        if level == 1:
            agent._send_native_notification("👋 Test Nudge", "This is a gentle reminder to stay focused.")
        elif level == 2:
            agent._send_native_notification("⚠️ Test Warning", "This is a firm warning from your AI coach.")
        else:
            agent._send_native_notification("🤖 Test Intervention", "This is how an AI intervention would look.")
            
        return {"status": "ok", "message": "Test notification sent"}
    except Exception as e:
        print(f"Error sending test notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/probability/calculate")
async def calculate_success_probability(user_id: Optional[str] = None):
    """
    Calculate success probability based on user's goal and behavior.
    Analyzes Chrome tabs, application usage, and behavior patterns.
    Returns probability score with detailed explanation.
    """
    try:
        # Get user's current goal from database
        current_goal = None
        if user_id:
            goal_data = db_service.get_current_goal(user_id)
            if goal_data:
                current_goal = goal_data.get("goal_text")
        
        # If no goal found, use default
        if not current_goal:
            current_goal = "achieve success in your career"
        
        # Get Chrome tabs data
        chrome_tabs = await orchestrator.get_chrome_tabs()
        
        # Get application usage metrics
        app_metrics = await orchestrator.get_metrics()
        
        # Get context switches
        context_switches = await orchestrator.get_context_switches()
        
        # Categorize tabs
        job_sites = ["linkedin.com", "indeed.com", "glassdoor.com", "monster.com", "ziprecruiter.com", "hired.com", "angel.co", "wellfound.com"]
        learning_sites = ["coursera.org", "udemy.com", "leetcode.com", "hackerrank.com", "codecademy.com", "freecodecamp.org", "udacity.com", "pluralsight.com", "educative.io", "stackoverflow.com", "github.com", "developer.mozilla.org", "w3schools.com"]
        entertainment_sites = ["youtube.com", "netflix.com", "reddit.com", "twitter.com", "instagram.com", "facebook.com", "tiktok.com", "twitch.tv"]
        
        job_time = 0
        learning_time = 0
        entertainment_time = 0
        other_time = 0
        
        for tab in chrome_tabs:
            url = tab.get("url", "").lower()
            time_spent = tab.get("total_time", 0)
            
            if any(site in url for site in job_sites):
                job_time += time_spent
            elif any(site in url for site in learning_sites):
                learning_time += time_spent
            elif any(site in url for site in entertainment_sites):
                entertainment_time += time_spent
            else:
                other_time += time_spent
        
        total_time = job_time + learning_time + entertainment_time + other_time
        
        # Create goal analysis based on user's actual goal
        goal_analysis = {
            "goal": current_goal,
            "skills": ["Goal-relevant skills", "Time management", "Focus", "Consistency"],
            "estimated_weeks": 12
        }
        
        # Prepare input for ProbabilityAgent
        probability_input = {
            "goal_analysis": goal_analysis,
            "user_metrics": app_metrics,
            "chrome_tabs": chrome_tabs,
            "tab_analysis": {
                "job_search_time": job_time,
                "learning_time": learning_time,
                "entertainment_time": entertainment_time,
                "other_time": other_time,
                "total_time": total_time,
                "productive_ratio": (job_time + learning_time) / total_time if total_time > 0 else 0
            },
            "context_switches": context_switches
        }
        
        # Calculate probability using ProbabilityAgent
        probability_result = await orchestrator.probability_agent.process(probability_input)
        
        # Add tab analysis to response
        probability_result["tab_breakdown"] = {
            "job_search_minutes": round(job_time / 60, 1),
            "learning_minutes": round(learning_time / 60, 1),
            "entertainment_minutes": round(entertainment_time / 60, 1),
            "productive_percentage": round((job_time + learning_time) / total_time * 100, 1) if total_time > 0 else 0
        }
        
        # Add the goal to the response
        probability_result["goal"] = current_goal
        
        return {
            "probability": probability_result,
            "status": "ok"
        }
        
    except Exception as e:
        print(f"Error calculating probability: {e}")
        import traceback
        traceback.print_exc()
        # Return fallback response
        return {
            "probability": {
                "score": 0.0,
                "explanation": "Unable to calculate probability. Please ensure you have some browsing activity tracked.",
                "positive_factors": [],
                "negative_factors": ["Insufficient data"],
                "confidence": "low",
                "goal": current_goal if current_goal else "No goal set",
                "tab_breakdown": {
                    "job_search_minutes": 0,
                    "learning_minutes": 0,
                    "entertainment_minutes": 0,
                    "productive_percentage": 0
                }
            },
            "status": "ok"
        }


@app.get("/api/analytics/weekly")
async def get_weekly_analytics(user_id: str):
    """
    Get weekly analytics data for charts.
    Returns daily stats for the last 7 days.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    try:
        stats = db_service.get_daily_stats(user_id, days=7)
        
        # Format for frontend chart
        # Ensure we have entries for all days, even if empty
        formatted_stats = []
        today = date.today()
        
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_str = day.isoformat()
            
            # Find stat for this day
            day_stat = next((s for s in stats if s['date'] == day_str), None)
            
            if day_stat:
                formatted_stats.append({
                    "date": day.strftime("%a"), # Mon, Tue, etc.
                    "full_date": day_str,
                    "success_probability": day_stat['success_probability'],
                    "focus_minutes": day_stat['focus_minutes'],
                    "distraction_minutes": day_stat['distraction_minutes']
                })
            else:
                formatted_stats.append({
                    "date": day.strftime("%a"),
                    "full_date": day_str,
                    "success_probability": 0, # Or None to show gap
                    "focus_minutes": 0,
                    "distraction_minutes": 0
                })
                
        return {
            "status": "ok",
            "stats": formatted_stats
        }
    except Exception as e:
        print(f"Error getting weekly analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FLOW STATE ENDPOINTS ====================

@app.post("/api/debug/seed")
async def seed_data(user_id: str):
    """
    Seed mock data for immediate value.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
        
    orchestrator.correlation_service.seed_mock_data(user_id)
    return {"status": "seeded"}

@app.post("/api/flow/enter")
async def enter_flow_state(request: Dict[str, Any]):
    """
    Enter Flow State.
    Closes distractors and opens productive tools.
    """
    goal = request.get("goal")
    if not goal:
        raise HTTPException(status_code=400, detail="goal is required")
        
    try:
        result = await orchestrator.flow_agent.process({
            "action": "enter",
            "goal": goal
        })
        return result
    except Exception as e:
        print(f"Error entering flow state: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/flow/exit")
async def exit_flow_state():
    """
    Exit Flow State.
    """
    try:
        result = await orchestrator.flow_agent.process({
            "action": "exit"
        })
        return result
    except Exception as e:
        print(f"Error exiting flow state: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/flow/status")
async def get_flow_status():
    """
    Get current Flow State status.
    """
    try:
        result = await orchestrator.flow_agent.process({
            "action": "status"
        })
        return result
    except Exception as e:
        print(f"Error getting flow status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/gamification/stats")
async def get_user_stats(user_id: str):
    """
    Get user's gamification stats (XP, Level).
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
        
    stats = await orchestrator.get_user_stats(user_id)
    return {
        "status": "ok",
        "stats": stats
    }


if __name__ == "__main__":
    # Run on port 14200 as specified
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=14200,
        log_level="info"
    )
